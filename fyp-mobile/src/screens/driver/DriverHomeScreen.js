import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import api from '../../services/api';

const COLORS = {
  navy: '#0A1628', accent: '#2E86DE', light: '#4FC3F7',
  white: '#FFFFFF', glass: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.12)',
  textMuted: 'rgba(255,255,255,0.55)',
  green: '#26D07C', red: '#FF4757', orange: '#FF9500',
};

const SOCKET_URL = 'http://192.168.228.77:5000'; // ← apna IP yahan

export default function DriverHomeScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationTracking, setLocationTracking] = useState(false);
  const [connectedPassengers, setConnectedPassengers] = useState(0);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchMyBookings();
    initSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const initSocket = () => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      const driverId = global.userInfo?.id;
      if (driverId) {
        socket.emit('driver:join', driverId);
        console.log('✅ Driver socket connected:', driverId);
      }
    });

    socket.on('connect_error', (err) => {
      console.log('Socket error:', err.message);
    });
  };

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/bookings/driver/my-bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      Alert.alert('Error', 'Could not load bookings!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission required!');
        return;
      }

      setLocationTracking(true);

      intervalRef.current = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          });

          const driverId = global.userInfo?.id;
          const locationData = {
            driver_id: driverId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed || 0,
            heading: location.coords.heading || 0,
          };

          // Send via Socket.io — real-time to passengers
          if (socketRef.current?.connected) {
            socketRef.current.emit('driver:location', locationData);
          }

          // Also save to database via API
          await api.post('/tracking/update', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed || 0,
            heading: location.coords.heading || 0,
            accuracy: location.coords.accuracy || 0,
          });

        } catch (err) {
          console.log('Location update error:', err);
        }
      }, 5000); // Every 5 seconds

      Alert.alert(
        '📍 Tracking Started!',
        'Your live location is now being shared with passengers!',
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert('Error', 'Could not start tracking!');
      setLocationTracking(false);
    }
  };

  const stopLocationTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setLocationTracking(false);
    Alert.alert('⏹️ Tracking Stopped', 'Location sharing stopped!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return COLORS.green;
      case 'pending': return '#ffc107';
      case 'cancelled': return COLORS.red;
      case 'completed': return COLORS.accent;
      case 'started': return COLORS.orange;
      default: return '#666';
    }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.vehicleName}>🚗 {item.model}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusTxt}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.info}>👤 {item.passenger_name}</Text>
      <Text style={styles.info}>📍 {item.pickup_location}</Text>
      <Text style={styles.info}>🏁 {item.dropoff_location}</Text>
      <Text style={styles.info}>📅 {new Date(item.start_time).toLocaleString('en-PK')}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.amount}>💰 Rs. {item.total_amount}</Text>
      </View>
      {item.status !== 'completed' && item.status !== 'cancelled' && (
        <TouchableOpacity
          style={styles.tripBtn}
          onPress={() => navigation.navigate('TripStatus', { booking: item })}
        >
          <Text style={styles.tripBtnTxt}>🚦 Manage Trip</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Driver Header */}
      <View style={styles.driverHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {global.userInfo?.name?.charAt(0).toUpperCase() || 'D'}
            </Text>
          </View>
          <View>
            <Text style={styles.driverName}>{global.userInfo?.name || 'Driver'}</Text>
            <Text style={styles.driverEmail}>{global.userInfo?.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.earningsBtn}
          onPress={() => navigation.navigate('Earnings')}
        >
          <Text style={styles.earningsTxt}>💰 Earnings</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {bookings.filter(b => b.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* GPS Tracking Toggle */}
      <TouchableOpacity
        style={[styles.trackingBtn, locationTracking && styles.trackingBtnActive]}
        onPress={locationTracking ? stopLocationTracking : startLocationTracking}
        activeOpacity={0.85}
      >
        <View>
          <Text style={styles.trackingTxt}>
            {locationTracking ? '⏹️ Stop Location Sharing' : '📍 Start Location Sharing'}
          </Text>
          <Text style={styles.trackingSubTxt}>
            {locationTracking
              ? 'Passengers can see your live location'
              : 'Tap to share your location with passengers'}
          </Text>
        </View>
        <View style={[styles.trackingDot, { backgroundColor: locationTracking ? COLORS.green : COLORS.red }]}>
          <Text style={styles.trackingDotTxt}>{locationTracking ? 'LIVE' : 'OFF'}</Text>
        </View>
      </TouchableOpacity>

      {/* Socket Status */}
      <View style={styles.socketStatus}>
        <View style={[styles.socketDot, {
          backgroundColor: socketRef.current?.connected ? COLORS.green : COLORS.red
        }]} />
        <Text style={styles.socketTxt}>
          {socketRef.current?.connected ? 'Real-time connected' : 'Connecting...'}
        </Text>
      </View>

      {/* Bookings */}
      <Text style={styles.sectionTitle}>My Bookings ({bookings.length})</Text>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.booking_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyBookings(); }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTxt}>No bookings assigned yet!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, padding: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  driverHeader: { backgroundColor: COLORS.accent, borderRadius: 15, padding: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 22, fontWeight: 'bold', color: COLORS.accent },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  driverEmail: { fontSize: 12, color: '#E8F0FE' },
  earningsBtn: { backgroundColor: COLORS.green, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  earningsTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.glass, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.accent },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  trackingBtn: { backgroundColor: COLORS.green, borderRadius: 12, padding: 15, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackingBtnActive: { backgroundColor: COLORS.red },
  trackingTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  trackingSubTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 3 },
  trackingDot: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  trackingDotTxt: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  socketStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  socketDot: { width: 8, height: 8, borderRadius: 4 },
  socketTxt: { fontSize: 11, color: COLORS.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white, marginBottom: 10 },
  card: { backgroundColor: COLORS.glass, borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  vehicleName: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: COLORS.glassBorder, marginBottom: 10 },
  info: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  cardFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  amount: { fontSize: 15, fontWeight: 'bold', color: COLORS.green },
  tripBtn: { backgroundColor: COLORS.accent, padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  tripBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyTxt: { fontSize: 16, color: COLORS.textMuted },
});