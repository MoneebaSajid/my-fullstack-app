import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, StatusBar
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { io } from 'socket.io-client';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');
const SOCKET_URL = '10.62.125.66:5000';


const COLORS = {
  navy:        '#0A1628',
  accent:      '#2E86DE',
  light:       '#4FC3F7',
  white:       '#FFFFFF',
  glass:       'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  textMuted:   'rgba(255,255,255,0.55)',
  green:       '#26D07C',
  red:         '#FF4757',
  orange:      '#FF9500',
};

export default function TrackDriverScreen({ route, navigation }) {
  const { booking } = route.params;
  const driver_id   = booking?.driver_id;
  const driver_name = booking?.driver_name;

  const [driverLocation,  setDriverLocation]  = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isLive,          setIsLive]          = useState(false);
  const [lastUpdateTime,  setLastUpdateTime]  = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [locationSource,  setLocationSource]  = useState('none');
  // none | db | live

  const mapRef    = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Step 1: Always fetch last known DB location first
    fetchLastKnownLocation();
    // Step 2: Connect socket for live updates
    initSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // ── STEP 1: Fetch last known location from DB ──
  // This works even when driver is offline
  const fetchLastKnownLocation = async () => {
    try {
      const res = await api.get(`/tracking/driver/${driver_id}`);
      const data = res.data?.driver || res.data;

      if (data?.current_latitude && data?.current_longitude) {
        const loc = {
          latitude:  parseFloat(data.current_latitude),
          longitude: parseFloat(data.current_longitude),
        };
        setDriverLocation(loc);
        setLocationHistory([loc]);
        setLocationSource('db');
        setLastUpdateTime(data.updated_at || data.last_updated || 'Last known');
        centerMap(loc);
      }
    } catch (err) {
      console.log('DB location fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Socket for live updates ──
  const initSocket = () => {
    const socket = io(SOCKET_URL, {
      transports:       ['websocket'],
      reconnection:     true,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      // Join this driver's tracking room
      socket.emit('passenger:track', driver_id);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      setIsLive(false);
    });

    // Live location update from driver
    socket.on('driver:location:update', (data) => {
      if (String(data.driver_id) !== String(driver_id)) return;

      const newLoc = {
        latitude:  parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
      };

      setDriverLocation(newLoc);
      setLocationHistory(prev => [...prev.slice(-50), newLoc]);
      setIsLive(true);
      setLocationSource('live');
      setLastUpdateTime(new Date().toLocaleTimeString('en-PK'));
      centerMap(newLoc);
    });

    // Driver went offline — still show last known location!
    socket.on('driver:offline', (data) => {
      if (String(data.driver_id) === String(driver_id)) {
        setIsLive(false);
        setLocationSource('db');
        // Don't clear location — still show last known!
      }
    });

    socket.on('connect_error', () => setSocketConnected(false));
  };

  const centerMap = (loc) => {
    mapRef.current?.animateToRegion({
      latitude:       loc.latitude,
      longitude:      loc.longitude,
      latitudeDelta:  0.01,
      longitudeDelta: 0.01,
    }, 800);
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingTxt}>Fetching driver location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude:       driverLocation?.latitude  || 31.5204,
          longitude:      driverLocation?.longitude || 74.3587,
          latitudeDelta:  0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic={false}
      >
        {/* Driver marker */}
        {driverLocation && (
          <Marker coordinate={driverLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[
              styles.driverMarker,
              { borderColor: isLive ? COLORS.green : COLORS.orange }
            ]}>
              <Text style={styles.driverMarkerEmoji}>🚗</Text>
              <Text style={styles.driverMarkerName}>
                {(driver_name || 'Driver').split(' ')[0]}
              </Text>
            </View>
          </Marker>
        )}

        {/* Route polyline */}
        {locationHistory.length > 1 && (
          <Polyline
            coordinates={locationHistory}
            strokeColor={isLive ? COLORS.green : COLORS.accent}
            strokeWidth={3}
            lineDashPattern={isLive ? [] : [8, 4]}
          />
        )}
      </MapView>

      {/* ── HEADER OVERLAY ── */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🗺️ Live Tracking</Text>
          {/* Source indicator */}
          <View style={[styles.sourcePill, {
            backgroundColor: isLive
              ? 'rgba(38,208,124,0.2)' : 'rgba(255,149,0,0.2)',
            borderColor: isLive ? COLORS.green : COLORS.orange,
          }]}>
            <View style={[styles.sourceDot, {
              backgroundColor: isLive ? COLORS.green : COLORS.orange,
            }]} />
            <Text style={[styles.sourceTxt, {
              color: isLive ? COLORS.green : COLORS.orange,
            }]}>
              {isLive ? 'LIVE' : 'LAST KNOWN LOCATION'}
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

      {/* ── BOTTOM CARD ── */}
      <View style={styles.bottomCard}>

        {/* Driver info */}
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarTxt}>
              {(driver_name || 'D').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverNameTxt}>{driver_name || 'Your Driver'}</Text>
            <Text style={styles.driverSubTxt}>
              {booking?.model || ''} · {booking?.reg_number || ''}
            </Text>
          </View>
          <View style={[styles.liveIndicator, {
            backgroundColor: isLive
              ? 'rgba(38,208,124,0.15)' : 'rgba(255,149,0,0.15)',
            borderColor: isLive ? COLORS.green : COLORS.orange,
          }]}>
            <Text style={[styles.liveIndicatorTxt, {
              color: isLive ? COLORS.green : COLORS.orange,
            }]}>
              {isLive ? '🟢 LIVE' : '🟡 LAST KNOWN'}
            </Text>
          </View>
        </View>

        {/* Location info */}
        {driverLocation ? (
          <View style={styles.locationCard}>
            <View style={styles.coordRow}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Latitude</Text>
                <Text style={styles.coordValue}>
                  {driverLocation.latitude.toFixed(5)}
                </Text>
              </View>
              <View style={styles.coordDivider} />
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Longitude</Text>
                <Text style={styles.coordValue}>
                  {driverLocation.longitude.toFixed(5)}
                </Text>
              </View>
              <View style={styles.coordDivider} />
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Updated</Text>
                <Text style={[styles.coordValue, { fontSize: 9 }]}>
                  {lastUpdateTime || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          // No location at all
          <View style={styles.noLocationCard}>
            <Text style={styles.noLocationIcon}>📍</Text>
            <Text style={styles.noLocationTitle}>Location Not Available</Text>
            <Text style={styles.noLocationSub}>
              Driver hasn't shared GPS location yet.{'\n'}
              Please ask your driver to start GPS sharing.
            </Text>
          </View>
        )}

        {/* Trip info */}
        <View style={styles.tripInfo}>
          <View style={styles.tripInfoRow}>
            <Text style={styles.tripInfoLabel}>📍 Pickup</Text>
            <Text style={styles.tripInfoVal} numberOfLines={1}>
              {booking?.pickup_location || 'Not set'}
            </Text>
          </View>
          <View style={styles.tripInfoRow}>
            <Text style={styles.tripInfoLabel}>🏁 Dropoff</Text>
            <Text style={styles.tripInfoVal} numberOfLines={1}>
              {booking?.dropoff_location || 'Not set'}
            </Text>
          </View>
        </View>

        {/* Socket status */}
        <View style={styles.socketRow}>
          <View style={[styles.socketDot, {
            backgroundColor: socketConnected ? COLORS.green : COLORS.red,
          }]} />
          <Text style={styles.socketTxt}>
            {socketConnected
              ? 'Real-time connection active — auto-updates when driver starts GPS'
              : 'Connecting to real-time server...'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.navy },
  loadingContainer:{ flex: 1, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:      { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
  map:             { width, height: height * 0.56 },

  // Header overlay
  headerOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'rgba(10,22,40,0.85)', gap: 10 },
  backBtn:         { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:      { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  headerCenter:    { flex: 1, alignItems: 'center' },
  headerTitle:     { color: COLORS.white, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  sourcePill:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  sourceDot:       { width: 6, height: 6, borderRadius: 3 },
  sourceTxt:       { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  centerBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  centerBtnTxt:    { color: COLORS.white, fontSize: 22, fontWeight: '700' },

  // Bottom card
  bottomCard:      { flex: 1, backgroundColor: COLORS.navy, padding: 14, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 1, borderColor: COLORS.glassBorder, marginTop: -22 },
  driverRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  driverAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  driverAvatarTxt: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  driverNameTxt:   { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  driverSubTxt:    { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  liveIndicator:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  liveIndicatorTxt:{ fontSize: 10, fontWeight: '800' },

  // Location card
  locationCard:    { backgroundColor: COLORS.glass, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.glassBorder },
  coordRow:        { flexDirection: 'row', alignItems: 'center' },
  coordItem:       { flex: 1, alignItems: 'center' },
  coordLabel:      { color: COLORS.textMuted, fontSize: 9, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  coordValue:      { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  coordDivider:    { width: 1, height: 28, backgroundColor: COLORS.glassBorder },

  // No location
  noLocationCard:  { backgroundColor: COLORS.glass, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: COLORS.glassBorder },
  noLocationIcon:  { fontSize: 30, marginBottom: 8 },
  noLocationTitle: { color: COLORS.white, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  noLocationSub:   { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // Trip info
  tripInfo:        { backgroundColor: COLORS.glass, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.glassBorder },
  tripInfoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tripInfoLabel:   { color: COLORS.textMuted, fontSize: 11, width: 70 },
  tripInfoVal:     { flex: 1, color: COLORS.white, fontSize: 12, fontWeight: '600' },

  // Socket
  socketRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  socketDot:       { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
  socketTxt:       { flex: 1, fontSize: 10, color: COLORS.textMuted, lineHeight: 14 },
});