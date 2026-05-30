import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
  Animated, Dimensions, StatusBar
} from 'react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

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
  yellow:      '#FFD700',
};

const STAGES = [
  {
    key:    'confirmed',
    label:  'Booking Confirmed',
    icon:   '✅',
    color:  COLORS.light,
    desc:   'Booking is confirmed. Head to pickup location.',
  },
  {
    key:    'started',
    label:  'Trip Started',
    icon:   '🚗',
    color:  COLORS.orange,
    desc:   'Trip is in progress. Drive safely!',
  },
  {
    key:    'completed',
    label:  'Trip Completed',
    icon:   '🏁',
    color:  COLORS.green,
    desc:   'Trip done! Vehicle returned to passenger.',
  },
];

const stageIndex = (status) =>
  STAGES.findIndex(s => s.key === status);

export default function TripStatusScreen({ route, navigation }) {
  const { booking } = route.params;

  const [currentStatus, setCurrentStatus] = useState(booking?.status || 'confirmed');
  const [loading,        setLoading]       = useState(false);
  const [bookingDetail,  setBookingDetail] = useState(booking);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const idx = stageIndex(currentStatus);
    Animated.timing(progressAnim, {
      toValue:  idx,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [currentStatus]);

  const updateStatus = async (newStatus) => {
    const currentIdx = stageIndex(currentStatus);
    const newIdx     = stageIndex(newStatus);

    // Can only go forward
    if (newIdx <= currentIdx) {
      Alert.alert('⚠️', 'Cannot go back to a previous status!');
      return;
    }

    // Confirm before completing
    if (newStatus === 'completed') {
      Alert.alert(
        '🏁 Complete Trip?',
        'Mark this trip as completed? Make sure vehicle has been returned.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Complete', onPress: () => doUpdate(newStatus) },
        ]
      );
      return;
    }

    doUpdate(newStatus);
  };

  const doUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await api.put('/bookings/update-status', {
        booking_id:   bookingDetail.booking_id,
        booking_type: bookingDetail.booking_type || 'with-driver',
        status:       newStatus,
      });

      setCurrentStatus(newStatus);

      if (newStatus === 'completed') {
        Alert.alert(
          '🏁 Trip Completed!',
          'Vehicle released. Passenger can now check their refund status.',
          [{ text: 'Go to Dashboard', onPress: () => navigation.navigate('DriverHome') }]
        );
      } else {
        Alert.alert('✅ Updated!', `Trip status: ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update status!');
    } finally {
      setLoading(false);
    }
  };

  const currentIdx   = stageIndex(currentStatus);
  const currentStage = STAGES[currentIdx] || STAGES[0];

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1, 2],
    outputRange: ['5%', '50%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>🚗 Trip Status</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Booking Card */}
        <View style={styles.bookingCard}>
          <View style={styles.bookingCardTop}>
            <View style={styles.carIconBox}>
              <Text style={styles.carIcon}>🚗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleModel}>
                {bookingDetail.model || 'Vehicle'}
              </Text>
              <Text style={styles.vehicleReg}>
                {bookingDetail.reg_number || ''}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: currentStage.color + '25', borderColor: currentStage.color + '60' }]}>
              <Text style={[styles.statusPillTxt, { color: currentStage.color }]}>
                {currentStage.icon} {currentStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.bookingMeta}>
            {bookingDetail.pickup_location && (
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaVal} numberOfLines={1}>
                  {bookingDetail.pickup_location}
                </Text>
              </View>
            )}
            {bookingDetail.dropoff_location && (
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>🏁</Text>
                <Text style={styles.metaVal} numberOfLines={1}>
                  {bookingDetail.dropoff_location}
                </Text>
              </View>
            )}
            {bookingDetail.passenger_name && (
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>👤</Text>
                <Text style={styles.metaVal}>{bookingDetail.passenger_name}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>💰</Text>
              <Text style={[styles.metaVal, { color: COLORS.green, fontWeight: '800' }]}>
                Rs. {bookingDetail.total_amount}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Progress Bar ── */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Trip Progress</Text>

          {/* Stage dots + labels */}
          <View style={styles.stagesRow}>
            {STAGES.map((stage, i) => {
              const done    = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <View key={stage.key} style={styles.stageItem}>
                  <View style={[
                    styles.stageDot,
                    done    && { backgroundColor: stage.color, borderColor: stage.color },
                    current && { transform: [{ scale: 1.25 }] },
                    !done   && { backgroundColor: 'transparent', borderColor: COLORS.glassBorder },
                  ]}>
                    <Text style={styles.stageDotTxt}>
                      {done ? stage.icon : '○'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.stageLabel,
                    { color: done ? stage.color : COLORS.textMuted },
                    current && { fontWeight: '800' },
                  ]}>
                    {stage.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Progress line */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, {
              width:           progressWidth,
              backgroundColor: currentStage.color,
            }]} />
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Update Trip Status</Text>
          <Text style={styles.actionsSubtitle}>
            Current: <Text style={{ color: currentStage.color, fontWeight: '700' }}>
              {currentStage.icon} {currentStatus.toUpperCase()}
            </Text>
          </Text>

          {/* Start Trip */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              currentStatus === 'confirmed'
                ? { backgroundColor: COLORS.orange }
                : styles.actionBtnDone,
            ]}
            onPress={() => updateStatus('started')}
            disabled={currentStatus !== 'confirmed' || loading}
          >
            {loading && currentStatus === 'confirmed'
              ? <ActivityIndicator color={COLORS.white} />
              : (
                <>
                  <Text style={styles.actionBtnIcon}>🚗</Text>
                  <View>
                    <Text style={styles.actionBtnLabel}>
                      {currentIdx >= 1 ? '✓ Trip Started' : 'Start Trip'}
                    </Text>
                    <Text style={styles.actionBtnSub}>
                      {currentIdx >= 1
                        ? 'Trip is in progress'
                        : 'Press when passenger is picked up'}
                    </Text>
                  </View>
                </>
              )
            }
          </TouchableOpacity>

          {/* Complete Trip */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              currentStatus === 'started'
                ? { backgroundColor: COLORS.green }
                : currentStatus === 'completed'
                  ? styles.actionBtnDone
                  : styles.actionBtnLocked,
            ]}
            onPress={() => updateStatus('completed')}
            disabled={currentStatus !== 'started' || loading}
          >
            {loading && currentStatus === 'started'
              ? <ActivityIndicator color={COLORS.white} />
              : (
                <>
                  <Text style={styles.actionBtnIcon}>
                    {currentStatus === 'completed' ? '✅' : '🏁'}
                  </Text>
                  <View>
                    <Text style={styles.actionBtnLabel}>
                      {currentStatus === 'completed'
                        ? '✓ Trip Completed'
                        : 'Complete Trip'}
                    </Text>
                    <Text style={styles.actionBtnSub}>
                      {currentStatus === 'completed'
                        ? 'Vehicle returned & refund processing'
                        : currentStatus === 'started'
                          ? 'Press when vehicle is returned'
                          : '🔒 Start trip first'}
                    </Text>
                  </View>
                </>
              )
            }
          </TouchableOpacity>

          {/* After completion info */}
          {currentStatus === 'completed' && (
            <View style={styles.completedInfo}>
              <Text style={styles.completedInfoTitle}>🎉 Trip Successfully Completed!</Text>
              <Text style={styles.completedInfoTxt}>
                • Vehicle marked as available{'\n'}
                • You are now available for new bookings{'\n'}
                • Passenger's refund is being processed{'\n'}
                • Passenger can check refund in My Bookings
              </Text>
            </View>
          )}
        </View>

        {/* ── Info Box ── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 Trip Rules Reminder</Text>
          <Text style={styles.infoTxt}>
            • Passenger's Rs. 2,000 deposit will be refunded based on vehicle condition{'\n'}
            • Late return = Rs. 200/hour deducted from deposit{'\n'}
            • Damage → partial or no refund{'\n'}
            • Mark completed ONLY when vehicle is returned
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.navy },
  blob1:          { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(46,134,222,0.1)', top: -80, right: -80 },
  blob2:          { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(79,195,247,0.06)', bottom: 100, left: -60 },
  scrollContent:  { padding: 16, paddingTop: 8 },

  // Header
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:        { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:     { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  topTitle:       { color: COLORS.white, fontSize: 17, fontWeight: '800' },

  // Booking card
  bookingCard:    { backgroundColor: COLORS.glass, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  bookingCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  carIconBox:     { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(46,134,222,0.15)', alignItems: 'center', justifyContent: 'center' },
  carIcon:        { fontSize: 24 },
  vehicleModel:   { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  vehicleReg:     { color: COLORS.textMuted, fontSize: 12, marginTop: 2, letterSpacing: 1 },
  statusPill:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  bookingMeta:    { gap: 8 },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaIcon:       { fontSize: 14, width: 20 },
  metaVal:        { color: COLORS.textMuted, fontSize: 13, flex: 1 },

  // Progress
  progressCard:   { backgroundColor: COLORS.glass, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  progressTitle:  { color: COLORS.white, fontSize: 14, fontWeight: '800', marginBottom: 16 },
  stagesRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  stageItem:      { flex: 1, alignItems: 'center', gap: 6 },
  stageDot:       { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stageDotTxt:    { fontSize: 16 },
  stageLabel:     { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  progressTrack:  { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 3 },

  // Actions
  actionsCard:    { backgroundColor: COLORS.glass, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  actionsTitle:   { color: COLORS.white, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  actionsSubtitle:{ color: COLORS.textMuted, fontSize: 12, marginBottom: 16 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, marginBottom: 12 },
  actionBtnDone:  { backgroundColor: 'rgba(38,208,124,0.12)', borderWidth: 1, borderColor: 'rgba(38,208,124,0.3)' },
  actionBtnLocked:{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.glassBorder },
  actionBtnIcon:  { fontSize: 28 },
  actionBtnLabel: { color: COLORS.white, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  actionBtnSub:   { color: COLORS.textMuted, fontSize: 11 },

  // Completed info
  completedInfo:  { backgroundColor: 'rgba(38,208,124,0.1)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(38,208,124,0.3)' },
  completedInfoTitle: { color: COLORS.green, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  completedInfoTxt:   { color: COLORS.textMuted, fontSize: 12, lineHeight: 20 },

  // Info box
  infoBox:        { backgroundColor: 'rgba(46,134,222,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(46,134,222,0.2)' },
  infoTitle:      { color: COLORS.light, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  infoTxt:        { color: COLORS.textMuted, fontSize: 12, lineHeight: 20 },
});