import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { io } from 'socket.io-client';
import api from '../../services/api'; 

const { width, height } = Dimensions.get('window');
// const SOCKET_URL = 'http://10.62.34.4:5000'; // ← apna IP yahan
// const API_URL = 'http://10.62.34.4:5000/api';
const SOCKET_URL = 'http://192.168.36.77:5000'; // ← apna IP yahan

const COLORS = {
  navy: '#0A1628', accent: '#2E86DE', light: '#4FC3F7',
  white: '#FFFFFF', glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  textMuted: 'rgba(255,255,255,0.55)',
  green: '#26D07C', red: '#FF4757', orange: '#FF9500',
};

export default function TrackDriverScreen({ route, navigation }) {
  const { booking, driver_id, driver_name } = route.params;
  const [driverLocation, setDriverLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const [driverOnline, setDriverOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchInitialLocation();
    initSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchInitialLocation = async () => {
    try {
      const res = await api.get(`/tracking/driver/${driver_id}`);
      if (res.data.driver?.latitude) {
        const loc = {
          latitude: parseFloat(res.data.driver.latitude),
          longitude: parseFloat(res.data.driver.longitude),
        };
        setDriverLocation(loc);
        setLocationHistory([loc]);
        setDriverOnline(true);
        centerMap(loc);
      }
    } catch (error) {
      console.log('Initial location fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const initSocket = () => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join tracking room for this driver
      socket.emit('passenger:track', driver_id);
      console.log(`✅ Tracking driver: ${driver_id}`);
    });

    socket.on('tracking:joined', (data) => {
      setDriverOnline(true);
      console.log('Tracking joined:', data);
    });

    socket.on('tracking:offline', (data) => {
      setDriverOnline(false);
      Alert.alert(
        'Driver GPS Off',
        'Driver has not started GPS tracking yet. Please wait.',
        [{ text: 'OK' }]
      );
    });

    // Live location update from driver
    socket.on('driver:location:update', (data) => {
      if (data.driver_id == driver_id) {
        const newLoc = {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        };
        setDriverLocation(newLoc);
        setLocationHistory(prev => [...prev.slice(-20), newLoc]); // Keep last 20 points
        setDriverOnline(true);
        setLastUpdate(new Date().toLocaleTimeString('en-PK'));
        centerMap(newLoc);
      }
    });

    socket.on('driver:offline', (data) => {
      if (data.driver_id == driver_id) {
        setDriverOnline(false);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.log('Socket connect error:', err.message);
      setConnected(false);
    });
  };

  const centerMap = (location) => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingTxt}>Connecting to driver...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation?.latitude || 31.5204,
          longitude: driverLocation?.longitude || 74.3587,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Driver Location */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title={`🚗 ${driver_name || 'Your Driver'}`}
            description={lastUpdate ? `Last update: ${lastUpdate}` : 'Waiting for location...'}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerIcon}>🚗</Text>
              <Text style={styles.driverMarkerTxt}>
                {driver_name?.split(' ')[0] || 'Driver'}
              </Text>
            </View>
          </Marker>
        )}

        {/* Route trail */}
        {locationHistory.length > 1 && (
          <Polyline
            coordinates={locationHistory}
            strokeColor={COLORS.accent}
            strokeWidth={3}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>🗺️ Live Tracking</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, {
              backgroundColor: driverOnline ? COLORS.green : COLORS.red
            }]} />
            <Text style={styles.statusTxt}>
              {driverOnline ? 'Driver is online' : 'Driver GPS off'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.centerBtn}
          onPress={() => driverLocation && centerMap(driverLocation)}
        >
          <Text style={styles.centerBtnTxt}>⊕</Text>
        </TouchableOpacity>
      </View>

      {/* Driver Info Card */}
      <View style={styles.driverCard}>
        {/* Driver Avatar & Name */}
        <View style={styles.driverTop}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarTxt}>
              {(driver_name || 'D').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>
              {driver_name || 'Your Driver'}
            </Text>
            <Text style={styles.driverSub}>
              {booking?.model || 'Vehicle'} • {booking?.reg_number || ''}
            </Text>
          </View>
          <View style={[styles.onlineBadge, {
            backgroundColor: driverOnline ? 'rgba(38,208,124,0.15)' : 'rgba(255,71,87,0.15)',
            borderColor: driverOnline ? COLORS.green : COLORS.red,
          }]}>
            <Text style={[styles.onlineTxt, { color: driverOnline ? COLORS.green : COLORS.red }]}>
              {driverOnline ? '● LIVE' : '● OFFLINE'}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        {driverLocation ? (
          <View style={styles.locationInfo}>
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>
                {driverLocation.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>
                {driverLocation.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Updated</Text>
              <Text style={styles.coordValue}>
                {lastUpdate || 'Waiting...'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noLocation}>
            <Text style={styles.noLocationTxt}>
              Waiting for driver to start GPS tracking...
            </Text>
          </View>
        )}

        {/* Connection Status */}
        <View style={styles.connectionRow}>
          <View style={[styles.connDot, { backgroundColor: connected ? COLORS.green : COLORS.red }]} />
          <Text style={styles.connTxt}>
            {connected ? 'Real-time connection active' : 'Connecting to server...'}
          </Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  loadingContainer: { flex: 1, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { color: COLORS.textMuted, fontSize: 15, marginTop: 10 },
  map: { width: width, height: height * 0.6 },
  driverMarker: {
    backgroundColor: COLORS.accent,
    borderRadius: 12, padding: 8,
    alignItems: 'center', borderWidth: 2.5,
    borderColor: COLORS.white, minWidth: 65,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 5, elevation: 8,
  },
  driverMarkerIcon: { fontSize: 22 },
  driverMarkerTxt: { color: COLORS.white, fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(10,22,40,0.88)', gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnTxt: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusTxt: { color: COLORS.textMuted, fontSize: 11 },
  centerBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  centerBtnTxt: { color: COLORS.white, fontSize: 20 },
  driverCard: {
    flex: 1,
    backgroundColor: COLORS.navy,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: COLORS.glassBorder,
    marginTop: -20,
  },
  driverTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    background: COLORS.accent,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  driverAvatarTxt: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  driverName: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  driverSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  onlineBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  onlineTxt: { fontSize: 11, fontWeight: '700' },
  locationInfo: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.glassBorder, padding: 14,
    marginBottom: 12,
  },
  coordItem: { flex: 1, alignItems: 'center' },
  coordLabel: { color: COLORS.textMuted, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  coordValue: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  coordDivider: { width: 1, height: 30, backgroundColor: COLORS.glassBorder },
  noLocation: {
    backgroundColor: COLORS.glass,
    borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  noLocationTxt: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connTxt: { fontSize: 11, color: COLORS.textMuted },
});