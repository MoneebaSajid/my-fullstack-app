import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Dimensions
} from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const SOCKET_URL = '10.0.74.243:5000';


const COLORS = {
  navy: '#0A1628',
  accent: '#2E86DE',
  light: '#4FC3F7',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  inputBg: 'rgba(255,255,255,0.06)',
  textMuted: 'rgba(255,255,255,0.55)',
  green: '#26D07C',
  red: '#FF4757',
  orange: '#FF9500',
  yellow: '#FFD700',
  purple: '#A78BFA',
};

const STATUS_CONFIG = {
  pending: { color: COLORS.yellow, icon: '⏳', label: 'Pending' },
  confirmed: { color: COLORS.green, icon: '✅', label: 'Confirmed' },
  started: { color: COLORS.orange, icon: '🚗', label: 'In Trip' },
  completed: { color: COLORS.light, icon: '🏁', label: 'Completed' },
  cancelled: { color: COLORS.red, icon: '❌', label: 'Cancelled' },
};

const TABS = [
  { key: 'active', label: 'My Trips', icon: '🚗' },
  { key: 'requests', label: 'Requests', icon: '📋' },
  { key: 'history', label: 'History', icon: '📅' },
];

export default function DriverHomeScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationTracking, setTracking] = useState(false);
  const [socketConnected, setSocketConn] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [acceptingId, setAcceptingId] = useState(null);

  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchMyBookings();
    fetchOpenRequests();
    initSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Socket init ──
  const initSocket = () => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConn(true);
      const driverId = global.userInfo?.id;
      if (driverId) {
        socket.emit('driver:join', driverId);
        // Also join general drivers room so passengers see ALL drivers
        socket.emit('driver:available', { driver_id: driverId });
      }
    });

    socket.on('disconnect', () => setSocketConn(false));
    socket.on('connect_error', () => setSocketConn(false));
  };

  // ── Fetch my assigned bookings ──
  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/bookings/driver/my-bookings');
      setBookings(res.data.bookings || []);
    } catch {
      Alert.alert('Error', 'Could not load bookings!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Fetch open passenger requests ──
  const fetchOpenRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get('/bookings/open-requests');
      setOpenRequests(res.data.requests || []);
    } catch {
      // Silently fail if endpoint not available
    } finally {
      setRequestsLoading(false);
    }
  };

  // ── Accept a passenger request ──
  const acceptRequest = async (booking_id, passengerName) => {
    Alert.alert(
      '📋 Accept Request?',
      `Accept booking from ${passengerName}?\nYou will be assigned to this trip.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAcceptingId(booking_id);
            try {
              const res = await api.post(`/bookings/accept/${booking_id}`);
              Alert.alert('✅ Accepted!', res.data.message || 'Booking accepted!');
              fetchMyBookings();
              fetchOpenRequests();
              setActiveTab('active');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not accept!');
            } finally {
              setAcceptingId(null);
            }
          },
        },
      ]
    );
  };

  // ── GPS Start ──
  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission required!');
      return;
    }

    const prov = await Location.getProviderStatusAsync();
    if (!prov.locationServicesEnabled) {
      Alert.alert('GPS Off', 'Please turn on device GPS!');
      return;
    }

    setTracking(true);
    intervalRef.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const driverId = global.userInfo?.id;
        const payload = {
          driver_id: driverId,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          speed: loc.coords.speed || 0,
          heading: loc.coords.heading || 0,
        };

        // Emit to specific passenger tracking room
        if (socketRef.current?.connected) {
          socketRef.current.emit('driver:location', payload);
          // Also broadcast to all — so NearestDrivers screen sees this driver
          socketRef.current.emit('driver:location:broadcast', payload);
        }

        // Save to DB
        await api.post('/tracking/update', {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          speed: loc.coords.speed || 0,
          heading: loc.coords.heading || 0,
          accuracy: loc.coords.accuracy || 0,
        });
      } catch (err) {
        console.log('GPS error:', err.message);
      }
    }, 5000);
    Alert.alert('📡 GPS Active', 'Your location is now visible to all passengers!');
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTracking(false);
    if (socketRef.current?.connected) {
      socketRef.current.emit('driver:offline', { driver_id: global.userInfo?.id });
    }
    Alert.alert('⏹️ GPS Stopped', 'Location sharing stopped.');
  };

  // ── Computed lists ──
  const activeBookings = bookings.filter(b => ['confirmed', 'started'].includes(b.status));
  const historyBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

  // ══════════════════════════════════════
  // RENDER: My Trip Card
  // ══════════════════════════════════════
  const renderMyBooking = ({ item }) => {
    const conf = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const canManage = ['confirmed', 'started'].includes(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.carIconBox}>
            <Text style={styles.carIconTxt}>🚗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardVehicle}>{item.model}</Text>
            <Text style={styles.cardReg}>{item.reg_number}</Text>
          </View>
          <View style={[styles.statusPill, {
            backgroundColor: conf.color + '20',
            borderColor: conf.color + '50',
          }]}>
            <Text style={styles.statusPillIcon}>{conf.icon}</Text>
            <Text style={[styles.statusPillTxt, { color: conf.color }]}>{conf.label}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />
        
        <InfoRow icon="👤" label="Passenger" value={item.passenger_name || 'N/A'} />
        <InfoRow icon="📱" label="Phone" value={item.passenger_phone || 'N/A'} />
        <InfoRow icon="📍" label="Pickup" value={item.pickup_location} lines={1} />
        <InfoRow icon="🏁" label="Dropoff" value={item.dropoff_location} lines={1} />
        <InfoRow icon="🛣️" label="Distance" value={`${parseFloat(item.estimated_distance || 0).toFixed(1)} km`} />
        
        <View style={styles.earningStrip}>
          <Text style={styles.earningLabel}>Your Earning</Text>
          <Text style={styles.earningAmt}>Rs. {parseFloat(item.total_amount || 0).toLocaleString()}</Text>
        </View>
        
        {canManage && (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => navigation.navigate('TripStatus', { booking: item })}
          >
            <Text style={styles.manageBtnTxt}>🚦 Manage Trip Status</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ══════════════════════════════════════
  // RENDER: Open Request Card
  // ══════════════════════════════════════
  const renderRequest = ({ item }) => {
    const isAccepting = acceptingId === item.booking_id;

    return (
      <View style={[styles.card, { borderColor: 'rgba(167,139,250,0.4)' }]}>
        {/* Request badge */}
        <View style={styles.requestBadge}>
          <Text style={styles.requestBadgeTxt}>📋 OPEN REQUEST</Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={[styles.carIconBox, { backgroundColor: 'rgba(167,139,250,0.15)' }]}>
            <Text style={styles.carIconTxt}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardVehicle}>{item.passenger_name}</Text>
            <Text style={styles.cardReg}>{item.passenger_phone || 'No phone'}</Text>
          </View>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeTxt}>NEW</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />
        
        <InfoRow icon="🚗" label="Vehicle" value={item.model} />
        <InfoRow icon="📍" label="Pickup" value={item.pickup_location} lines={1} />
        <InfoRow icon="🏁" label="Dropoff" value={item.dropoff_location} lines={1} />
        <InfoRow icon="🛣️" label="Distance" value={`${parseFloat(item.estimated_distance || 0).toFixed(1)} km`} />
        <InfoRow icon="⏱️" label="Rate" value={item.rate_type?.toUpperCase() || 'HOURLY'} />
        
        <View style={styles.earningStrip}>
          <Text style={styles.earningLabel}>Trip Fare</Text>
          <Text style={[styles.earningAmt, { color: COLORS.purple }]}>
            Rs. {parseFloat(item.total_amount || 0).toLocaleString()}
          </Text>
        </View>

        {/* Accept button */}
        <TouchableOpacity
          style={[styles.acceptBtn, isAccepting && { opacity: 0.7 }]}
          onPress={() => acceptRequest(item.booking_id, item.passenger_name)}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.acceptBtnTxt}>✅ Accept This Request</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ══════════════════════════════════════
  // RENDER: History Card (compact)
  // ══════════════════════════════════════
  const renderHistory = ({ item }) => {
    const conf = STATUS_CONFIG[item.status] || STATUS_CONFIG.completed;

    return (
      <View style={styles.historyCard}>
        <View style={styles.historyLeft}>
          <Text style={styles.historyIcon}>{conf.icon}</Text>
          <View>
            <Text style={styles.historyVehicle}>{item.model}</Text>
            <Text style={styles.historyPassenger}>{item.passenger_name}</Text>
            <Text style={styles.historyDate}>
              {new Date(item.start_time).toLocaleDateString('en-PK')}
            </Text>
          </View>
        </View>
        <View style={styles.historyRight}>
          <Text style={[styles.historyStatus, { color: conf.color }]}>{conf.label}</Text>
          <Text style={styles.historyAmount}>
            Rs. {parseFloat(item.total_amount || 0).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingTxt}>Loading dashboard...</Text>
      </View>
    );
  }

  const tabData = {
    active: activeBookings,
    requests: openRequests,
    history: historyBookings,
  };

  const tabRenders = {
    active: renderMyBooking,
    requests: renderRequest,
    history: renderHistory,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
  <Text style={styles.backBtnTxt}>←</Text>
</TouchableOpacity>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {(global.userInfo?.name || 'D').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.driverName}>{global.userInfo?.name || 'Driver'}</Text>
            <View style={styles.connRow}>
              <View style={[styles.connDot, { backgroundColor: socketConnected ? COLORS.green : COLORS.red }]} />
              <Text style={styles.connTxt}>{socketConnected ? 'Online' : 'Connecting...'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.earningsBtn} onPress={() => navigation.navigate('Earnings')}>
          <Text style={styles.earningsBtnIcon}>💰</Text>
          <Text style={styles.earningsBtnTxt}>Earnings</Text>
        </TouchableOpacity>
      </View>

      {/* ── STATS ── */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: bookings.length, color: COLORS.accent },
          { label: 'Active', value: activeBookings.length, color: COLORS.orange },
          { label: 'Done', value: historyBookings.filter(b => b.status === 'completed').length, color: COLORS.green },
          { label: 'Requests', value: openRequests.length, color: COLORS.purple },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── GPS TOGGLE ── */}
      <TouchableOpacity
        style={[styles.gpsBtn, locationTracking && styles.gpsBtnActive]}
        onPress={locationTracking ? stopTracking : startTracking}
      >
        <View style={styles.gpsBtnLeft}>
          <Text style={styles.gpsBtnIcon}>{locationTracking ? '📡' : '📍'}</Text>
          <View>
            <Text style={styles.gpsBtnTitle}>
              {locationTracking ? 'GPS Sharing Active' : 'Share My Location'}
            </Text>
            <Text style={styles.gpsBtnSub}>
              {locationTracking
                ? 'All passengers can see your live location'
                : 'Tap to become visible to passengers'}
            </Text>
          </View>
        </View>
        <View style={[styles.gpsPill, { backgroundColor: locationTracking ? COLORS.green : COLORS.red }]}>
          <Text style={styles.gpsPillTxt}>{locationTracking ? 'LIVE' : 'OFF'}</Text>
        </View>
      </TouchableOpacity>

      {/* ── TABS ── */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const count = tabData[tab.key]?.length || 0;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab.key);
                if (tab.key === 'requests') fetchOpenRequests();
              }}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabTxt, isActive && styles.tabTxtActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCount, {
                  backgroundColor: tab.key === 'requests'
                    ? COLORS.purple : isActive ? 'rgba(255,255,255,0.3)' : COLORS.glassBorder
                }]}>
                  <Text style={styles.tabCountTxt}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── CONTENT ── */}
      {activeTab === 'requests' && requestsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.loadingTxt}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={tabData[activeTab]}
          renderItem={tabRenders[activeTab]}
          keyExtractor={(item) => item.booking_id.toString()}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchMyBookings();
                fetchOpenRequests();
              }}
              tintColor={COLORS.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>
                {activeTab === 'requests' ? '📋' : activeTab === 'active' ? '🕐' : '📅'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'requests'
                  ? 'No open requests right now'
                  : activeTab === 'active'
                    ? 'No active trips'
                    : 'No trip history'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'requests'
                  ? 'Passengers will appear here when they book'
                  : 'Pull down to refresh'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Reusable info row ──
const InfoRow = ({ icon, label, value, lines = 0 }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoVal} numberOfLines={lines || undefined}>
      {value || 'N/A'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, paddingHorizontal: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingTxt: { color: COLORS.textMuted, marginTop: 10, fontSize: 13 },
  blob1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(46,134,222,0.08)', top: -80, right: -60 },
  blob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(167,139,250,0.05)', bottom: 100, left: -60 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, marginBottom: 14, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  driverInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  driverName: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connTxt: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  earningsBtn: { backgroundColor: COLORS.glass, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  earningsBtnIcon: { fontSize: 18, marginBottom: 2 },
  earningsBtnTxt: { color: COLORS.green, fontSize: 10, fontWeight: '700' },
  
  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.glass, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  statValue: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  
  // GPS
  gpsBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(38,208,124,0.12)', borderRadius: 14, padding: 13, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(38,208,124,0.3)' },
  gpsBtnActive: { backgroundColor: 'rgba(255,71,87,0.1)', borderColor: 'rgba(255,71,87,0.3)' },
  gpsBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  gpsBtnIcon: { fontSize: 24 },
  gpsBtnTitle: { color: COLORS.white, fontSize: 13, fontWeight: '800', marginBottom: 1 },
  gpsBtnSub: { color: COLORS.textMuted, fontSize: 10 },
  gpsPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  gpsPillTxt: { color: COLORS.white, fontWeight: '800', fontSize: 10 },
  
  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: 14, padding: 4, marginBottom: 10, borderWidth: 1, borderColor: COLORS.glassBorder },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
  tabActive: { backgroundColor: COLORS.accent },
  tabIcon: { fontSize: 13 },
  tabTxt: { color: COLORS.textMuted, fontWeight: '700', fontSize: 11 },
  tabTxtActive: { color: COLORS.white },
  tabCount: { borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  tabCountTxt: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  listPadding: { paddingBottom: 50 },
  
  // Booking card
  card: { backgroundColor: COLORS.glass, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  carIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(46,134,222,0.15)', alignItems: 'center', justifyContent: 'center' },
  carIconTxt: { fontSize: 20 },
  cardVehicle: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  cardReg: { color: COLORS.textMuted, fontSize: 11, marginTop: 1, letterSpacing: 0.5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusPillIcon: { fontSize: 10 },
  statusPillTxt: { fontSize: 9, fontWeight: '800' },
  cardDivider: { height: 1, backgroundColor: COLORS.glassBorder, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  infoIcon: { fontSize: 12, width: 18 },
  infoLabel: { color: COLORS.textMuted, fontSize: 11, width: 65 },
  infoVal: { flex: 1, color: COLORS.white, fontSize: 11, fontWeight: '600', textAlign: 'right' },
  earningStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.glassBorder, marginTop: 4, marginBottom: 10 },
  earningLabel: { color: COLORS.textMuted, fontSize: 12 },
  earningAmt: { color: COLORS.green, fontSize: 17, fontWeight: '900' },
  manageBtn: { backgroundColor: COLORS.accent, padding: 11, borderRadius: 11, alignItems: 'center' },
  manageBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  
  // Request specific
  requestBadge: { backgroundColor: 'rgba(167,139,250,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' },
  requestBadgeTxt: { color: COLORS.purple, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  newBadge: { backgroundColor: COLORS.orange, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeTxt: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  acceptBtn: { backgroundColor: COLORS.green, padding: 13, borderRadius: 12, alignItems: 'center' },
  acceptBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  
  // History
  historyCard: { backgroundColor: COLORS.glass, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.glassBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  historyIcon: { fontSize: 22 },
  historyVehicle: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  historyPassenger: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  historyDate: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  historyRight: { alignItems: 'flex-end' },
  historyStatus: { fontSize: 10, fontWeight: '800', marginBottom: 4 },
  historyAmount: { color: COLORS.green, fontSize: 14, fontWeight: '800' },
  
  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
});