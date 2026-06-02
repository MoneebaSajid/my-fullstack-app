import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
  StatusBar
} from 'react-native';
import api from '../../services/api';

const COLORS = {
  navy: '#0A1628', blue: '#1A3C6E', accent: '#2E86DE',
  light: '#4FC3F7', white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.08)', glassBorder: 'rgba(255,255,255,0.15)',
  inputBg: 'rgba(255,255,255,0.06)', textMuted: 'rgba(255,255,255,0.55)',
  green: '#26D07C', warning: '#FFC107', danger: '#FF4D4D', orange: '#FF9500',
};

// ── Status config — aik jagah sab kuch ──
const STATUS_CONFIG = {
  pending:   { color: COLORS.warning, label: 'PENDING',   icon: '⏳' },
  confirmed: { color: COLORS.green,   label: 'CONFIRMED', icon: '✅' },
  started:   { color: COLORS.orange,  label: 'STARTED',   icon: '🚗' },
  completed: { color: COLORS.light,   label: 'COMPLETED', icon: '🏁' },
  cancelled: { color: COLORS.danger,  label: 'CANCELLED', icon: '❌' },
};

export default function MyBookingsScreen({ navigation }) {
  const [bookings,   setBookings]   = useState({ with_driver: [], without_driver: [] });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState('with_driver');

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings({
        with_driver:    res.data.bookings_with_driver    || [],
        without_driver: res.data.bookings_without_driver || [],
      });
    } catch {
      Alert.alert('Error', 'Could not load bookings!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ══════════════════════════════════════════════
  // ACTION BUTTONS — logical mapping
  //
  // pending   → 💳 Pay Now  (payment not done)
  // confirmed → 🗺️ Track    (payment done, trip not started)
  // started   → 🗺️ Track    (trip in progress)
  // completed → ⭐ Feedback + 💰 Refund
  // cancelled → nothing
  // ══════════════════════════════════════════════
  const renderActions = (item, type) => {
    const status = item.status;

    return (
      <View style={styles.actionsWrap}>
        {/* ── PENDING: Pay Now only ── */}
        {status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.orange }]}
            onPress={() => navigation.navigate('Payment', {
              booking_id:     item.booking_id,
              booking_type:   type,
              total_amount:   item.total_amount,
              receipt_number: item.receipt_number || `NXR-${item.booking_id}`,
              fare_details:   item.fare_details   || {},
            })}
          >
            <Text style={styles.actionTxt}>💳 Pay Now</Text>
          </TouchableOpacity>
        )}

        {/* ── CONFIRMED: Paid, waiting for trip ── */}
        {status === 'confirmed' && (
          <View style={styles.confirmedBadge}>
            <Text style={styles.confirmedTxt}>✅ Payment Done</Text>
          </View>
        )}

        {/* ── COMPLETED: Feedback + Refund ── */}
        {status === 'completed' && (
          <View style={styles.completedBtns}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.accent }]}
              onPress={() => navigation.navigate('Feedback', {
                booking_id:   item.booking_id,
                booking_type: type,
                driver_id:    item.driver_id || null,
              })}
            >
              <Text style={styles.actionTxt}>⭐ Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refundBtn}
              onPress={() => navigation.navigate('RefundStatus', {
                booking_id:      item.booking_id,
                booking_type:    type,
                vehicle_model:   item.model,
                pickup_location: item.pickup_location || item.self_pickup_location,
              })}
            >
              <Text style={styles.refundBtnTxt}>💰 Refund</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ══════════════════════════════════════════════
  // WITH DRIVER CARD
  // ══════════════════════════════════════════════
  const renderWithDriver = ({ item }) => {
    const conf    = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const canTrack = item.status === 'confirmed' || item.status === 'started';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.vehicleIconBox}>
            <Text style={styles.vehicleIconTxt}>🚗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{item.model}</Text>
            <Text style={styles.vehicleReg}>{item.reg_number}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: conf.color + '60', backgroundColor: conf.color + '20' }]}>
            <Text style={{ fontSize: 10 }}>{conf.icon}</Text>
            <Text style={[styles.statusTxt, { color: conf.color }]}>{conf.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info rows */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>👨‍✈️ Driver</Text>
          <Text style={styles.infoValue}>{item.driver_name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Pickup</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.pickup_location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🏁 Dropoff</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.dropoff_location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🛣️ Distance</Text>
          <Text style={styles.infoValue}>{parseFloat(item.estimated_distance || 0).toFixed(1)} km</Text>
        </View>

        {/* Date strip */}
        <View style={styles.dateStrip}>
          <Text style={styles.dateTxt}>
            📅 {new Date(item.start_time).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
          <Text style={styles.dateArrow}>→</Text>
          <Text style={styles.dateTxt}>
            {new Date(item.end_time).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>

        {/* Fare */}
        <View style={styles.fareStrip}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmt}>Rs. {parseFloat(item.total_amount || 0).toLocaleString()}</Text>
        </View>

        {/* Action buttons */}
        {renderActions(item, 'with-driver')}

        {/* Track button — confirmed or started only */}
        {canTrack && (
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('TrackDriver', {
              booking:     item,
              driver_id:   item.driver_id,
              driver_name: item.driver_name,
            })}
          >
            <Text style={styles.trackBtnTxt}>🗺️ Track My Driver</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ══════════════════════════════════════════════
  // WITHOUT DRIVER CARD
  // ══════════════════════════════════════════════
  const renderWithoutDriver = ({ item }) => {
    const conf = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.vehicleIconBox}>
            <Text style={styles.vehicleIconTxt}>🚗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{item.model}</Text>
            <Text style={styles.vehicleReg}>{item.reg_number}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: conf.color + '60', backgroundColor: conf.color + '20' }]}>
            <Text style={{ fontSize: 10 }}>{conf.icon}</Text>
            <Text style={[styles.statusTxt, { color: conf.color }]}>{conf.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📋 Reg No.</Text>
          <Text style={styles.infoValue}>{item.reg_number}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Pickup</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.self_pickup_location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🛣️ Distance</Text>
          <Text style={styles.infoValue}>{parseFloat(item.estimated_distance || 0).toFixed(1)} km</Text>
        </View>

        <View style={styles.dateStrip}>
          <Text style={styles.dateTxt}>
            📅 {new Date(item.start_date).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
          </Text>
          <Text style={styles.dateArrow}>→</Text>
          <Text style={styles.dateTxt}>
            {new Date(item.end_date).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
          </Text>
        </View>

        <View style={styles.fareStrip}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmt}>Rs. {parseFloat(item.total_amount || 0).toLocaleString()}</Text>
        </View>

        {renderActions(item, 'without-driver')}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingTxt}>Loading your rides...</Text>
      </View>
    );
  }

  const activeData = activeTab === 'with_driver'
    ? bookings.with_driver : bookings.without_driver;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSub}>Manage your travel history</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'with_driver',    label: '👨‍✈️ Chauffeur', count: bookings.with_driver.length },
          { key: 'without_driver', label: '🚗 Self Drive', count: bookings.without_driver.length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabTxt, activeTab === tab.key && styles.tabTxtActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeTxt, activeTab === tab.key && { color: COLORS.white }]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={activeData}
        renderItem={activeTab === 'with_driver' ? renderWithDriver : renderWithoutDriver}
        keyExtractor={(item) => item.booking_id.toString()}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBookings(); }}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySubtitle}>Your trips will appear here</Text>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => navigation.navigate('vehicles')}
            >
              <Text style={styles.bookNowTxt}>Browse Vehicles </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.navy },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingTxt:    { color: COLORS.textMuted, marginTop: 10 },
  circle1:       { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(46,134,222,0.09)', top: -50, right: -50 },
  circle2:       { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(79,195,247,0.05)', bottom: 50, left: -40 },

  // Header
  header:        { paddingTop: 58, paddingHorizontal: 24, marginBottom: 18 },
  headerTitle:   { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
  headerSub:     { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 },

  // Tabs
  tabContainer:  { flexDirection: 'row', backgroundColor: COLORS.inputBg, marginHorizontal: 24, borderRadius: 16, padding: 5, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 14 },
  tab:           { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tabActive:     { backgroundColor: COLORS.accent },
  tabTxt:        { color: COLORS.textMuted, fontWeight: '700', fontSize: 12 },
  tabTxtActive:  { color: COLORS.white },
  tabBadge:      { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  tabBadgeActive:{ backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeTxt:   { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  listPadding:   { paddingHorizontal: 24, paddingBottom: 50 },

  // Card
  card:          { backgroundColor: COLORS.glass, borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  vehicleIconBox:{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(46,134,222,0.15)', alignItems: 'center', justifyContent: 'center' },
  vehicleIconTxt:{ fontSize: 22 },
  vehicleName:   { fontSize: 16, fontWeight: '800', color: COLORS.white },
  vehicleReg:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2, letterSpacing: 1 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  statusTxt:     { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  divider:       { height: 1, backgroundColor: COLORS.glassBorder, marginBottom: 12 },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel:     { fontSize: 12, color: COLORS.textMuted },
  infoValue:     { fontSize: 12, color: COLORS.white, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  // Date strip
  dateStrip:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, marginVertical: 10, gap: 8 },
  dateTxt:       { color: COLORS.light, fontSize: 11, fontWeight: '600' },
  dateArrow:     { color: COLORS.textMuted, fontSize: 14 },

  // Fare strip
  fareStrip:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.glassBorder, marginBottom: 12 },
  fareLabel:     { fontSize: 12, color: COLORS.textMuted },
  fareAmt:       { fontSize: 20, fontWeight: '900', color: COLORS.green },

  // Actions wrap
  actionsWrap:   { marginBottom: 6 },

  // Pay Now
  actionBtn:     { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  actionTxt:     { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  // Confirmed badge
  confirmedBadge:{ backgroundColor: 'rgba(38,208,124,0.12)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(38,208,124,0.3)' },
  confirmedTxt:  { color: COLORS.green, fontWeight: '700', fontSize: 13 },

  // Completed
  completedBtns: { flexDirection: 'row', gap: 10 },
  refundBtn:     { flex: 1, backgroundColor: 'rgba(38,208,124,0.12)', paddingVertical: 11, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(38,208,124,0.35)' },
  refundBtnTxt:  { color: COLORS.green, fontWeight: '700', fontSize: 13 },

  // Track
  trackBtn:      { backgroundColor: 'rgba(46,134,222,0.15)', borderWidth: 1, borderColor: COLORS.accent, padding: 11, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  trackBtnTxt:   { color: COLORS.light, fontWeight: '700', fontSize: 13 },

  // Empty
  emptyContainer:{ alignItems: 'center', paddingTop: 60 },
  emptyIcon:     { fontSize: 60, marginBottom: 14 },
  emptyTitle:    { color: COLORS.white, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 24 },
  bookNowBtn:    { backgroundColor: COLORS.accent, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  bookNowTxt:    { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});