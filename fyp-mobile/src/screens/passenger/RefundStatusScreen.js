import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
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
  inputBg:     'rgba(255,255,255,0.06)',
  textMuted:   'rgba(255,255,255,0.55)',
  green:       '#26D07C',
  red:         '#FF4757',
  orange:      '#FF9500',
  yellow:      '#FFD700',
};

const DEPOSIT = 2000;

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: COLORS.yellow,  icon: '⏳', desc: 'Vehicle not yet returned'        },
  approved:   { label: 'Approved',   color: COLORS.light,   icon: '✅', desc: 'Refund approved, processing...'  },
  processing: { label: 'Processing', color: COLORS.orange,  icon: '🔄', desc: 'Being transferred to your account'},
  completed:  { label: 'Completed',  color: COLORS.green,   icon: '💰', desc: 'Refund credited successfully!'    },
  rejected:   { label: 'Rejected',   color: COLORS.red,     icon: '❌', desc: 'Deposit forfeited — see details'  },
};

const CONDITION_LABELS = {
  excellent:    { label: 'Excellent 🌟', color: COLORS.green  },
  good:         { label: 'Good ✅',       color: COLORS.green  },
  minor_damage: { label: 'Minor Damage ⚠️', color: COLORS.orange },
  major_damage: { label: 'Major Damage ❌', color: COLORS.red   },
};

// ── Circular progress ──
const RefundCircle = ({ refundAmount, depositAmount }) => {
  const pct      = depositAmount > 0 ? refundAmount / depositAmount : 0;
  const isZero   = pct === 0;
  const isFull   = pct === 1;
  const color    = isFull ? COLORS.green : isZero ? COLORS.red : COLORS.orange;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.circleWrap, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.circleBg, { borderColor: color + '40' }]}>
        <View style={[styles.circleInner, { borderColor: color }]}>
          <Text style={styles.circleEmoji}>
            {isFull ? '💰' : isZero ? '❌' : '⚖️'}
          </Text>
          <Text style={[styles.circleAmt, { color }]}>
            Rs. {refundAmount.toLocaleString()}
          </Text>
          <Text style={styles.circleLabel}>Refund Amount</Text>
          <Text style={[styles.circlePct, { color }]}>
            {Math.round(pct * 100)}% of deposit
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ── Deduction row ──
const DeductRow = ({ label, amount, color = COLORS.red }) => {
  if (!amount || amount <= 0) return null;
  return (
    <View style={styles.deductRow}>
      <View style={[styles.deductDot, { backgroundColor: color }]} />
      <Text style={styles.deductLabel}>{label}</Text>
      <Text style={[styles.deductAmt, { color }]}>- Rs. {amount}</Text>
    </View>
  );
};

export default function RefundStatusScreen({ route, navigation }) {
  const { booking_id, booking_type, vehicle_model, pickup_location } = route.params;

  const [loading,      setLoading]      = useState(true);
  const [refundData,   setRefundData]   = useState(null);
  const [found,        setFound]        = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRefundStatus();
  }, []);

  const fetchRefundStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/refunds/status/${booking_id}`);
      setFound(res.data.found);
      setRefundData(res.data);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }).start();
    } catch (err) {
      setFound(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingTxt}>Checking refund status...</Text>
        </View>
      </View>
    );
  }

  const status     = refundData?.refund_status || 'pending';
  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const condition  = refundData?.return_condition || 'good';
  const condConf   = CONDITION_LABELS[condition]  || CONDITION_LABELS.good;

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
        <Text style={styles.topTitle}>💰 Refund Status</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchRefundStatus}>
          <Text style={styles.refreshTxt}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Booking Info Strip */}
        <View style={styles.bookingStrip}>
          <Text style={styles.bookingStripIcon}>🚗</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingStripModel}>{vehicle_model || 'Vehicle'}</Text>
            <Text style={styles.bookingStripSub}>
              Booking #{booking_id} · {pickup_location || 'Trip'}
            </Text>
          </View>
        </View>

        {/* ── NOT RETURNED YET ── */}
        {!found && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.pendingCard}>
              <Text style={styles.pendingIcon}>⏳</Text>
              <Text style={styles.pendingTitle}>Refund Not Yet Processed</Text>
              <Text style={styles.pendingDesc}>
                Your vehicle has not been marked as returned yet.{'\n'}
                Once you return the vehicle, our team will inspect it and process your refund within <Text style={{ color: COLORS.green, fontWeight: '700' }}>3–5 business days.</Text>
              </Text>

              {/* Deposit reminder */}
              <View style={styles.depositReminder}>
                <View style={styles.depositReminderLeft}>
                  <Text style={styles.depositReminderLabel}>Your Deposit</Text>
                  <Text style={styles.depositReminderAmt}>Rs. {DEPOSIT.toLocaleString()}</Text>
                  <Text style={styles.depositReminderSub}>Protected & Refundable</Text>
                </View>
                <Text style={styles.depositReminderIcon}>🛡️</Text>
              </View>

              {/* Conditions reminder */}
              <View style={styles.conditionsCard}>
                <Text style={styles.conditionsTitle}>✅ To Get Full Deposit Back:</Text>
                {[
                  'Return vehicle on time',
                  'No new damage (exterior/interior)',
                  'Fuel level maintained',
                  'All accessories returned',
                  'No traffic violations',
                ].map((c, i) => (
                  <View key={i} style={styles.condRow}>
                    <View style={[styles.condDot, { backgroundColor: COLORS.green }]} />
                    <Text style={styles.condTxt}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── REFUND FOUND ── */}
        {found && refundData && (
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* Status Banner */}
            <View style={[styles.statusBanner, {
              backgroundColor: statusConf.color + '20',
              borderColor:     statusConf.color + '50',
            }]}>
              <Text style={styles.statusBannerIcon}>{statusConf.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusBannerLabel, { color: statusConf.color }]}>
                  {statusConf.label}
                </Text>
                <Text style={styles.statusBannerDesc}>{statusConf.desc}</Text>
              </View>
            </View>

            {/* Refund Circle */}
            <RefundCircle
              refundAmount={parseFloat(refundData.refund_amount || 0)}
              depositAmount={parseFloat(refundData.deposit_amount || DEPOSIT)}
            />

            {/* Breakdown Card */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>💳 Refund Breakdown</Text>

              {/* Deposit */}
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Security Deposit</Text>
                <Text style={[styles.breakdownVal, { color: COLORS.white }]}>
                  Rs. {parseFloat(refundData.deposit_amount || DEPOSIT).toLocaleString()}
                </Text>
              </View>

              {/* Deductions */}
              {parseFloat(refundData.total_deductions) > 0 && (
                <View style={styles.deductionsSection}>
                  <Text style={styles.deductionsTitle}>Deductions:</Text>
                  <DeductRow
                    label="⏰ Late return fee"
                    amount={parseFloat(refundData.deductions?.late_fee   || 0)}
                  />
                  <DeductRow
                    label="🔧 Damage repair"
                    amount={parseFloat(refundData.deductions?.damage      || 0)}
                  />
                  <DeductRow
                    label="🧹 Cleaning fee"
                    amount={parseFloat(refundData.deductions?.cleaning    || 0)}
                  />
                  <DeductRow
                    label="⛽ Fuel shortfall"
                    amount={parseFloat(refundData.deductions?.fuel        || 0)}
                  />
                  <DeductRow
                    label="🔩 Missing accessories"
                    amount={parseFloat(refundData.deductions?.accessories || 0)}
                  />
                  <View style={styles.deductTotalRow}>
                    <Text style={styles.deductTotalLabel}>Total Deducted</Text>
                    <Text style={[styles.deductTotalAmt, { color: COLORS.red }]}>
                      - Rs. {parseFloat(refundData.total_deductions).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.breakdownDivider} />

              {/* Final */}
              <View style={[styles.breakdownRow, { marginTop: 6 }]}>
                <Text style={[styles.breakdownLabel, { color: COLORS.white, fontWeight: '800', fontSize: 15 }]}>
                  REFUND AMOUNT
                </Text>
                <Text style={[styles.breakdownVal, {
                  color:     parseFloat(refundData.refund_amount) > 0 ? COLORS.green : COLORS.red,
                  fontSize:  18,
                  fontWeight:'800',
                }]}>
                  Rs. {parseFloat(refundData.refund_amount || 0).toLocaleString()}
                </Text>
              </View>

              {/* Refund method */}
              {refundData.refund_method && (
                <View style={styles.methodRow}>
                  <Text style={styles.methodLabel}>Refund via:</Text>
                  <Text style={[styles.methodVal, { color: COLORS.light }]}>
                    {refundData.refund_method}
                  </Text>
                </View>
              )}
            </View>

            {/* Vehicle Condition Card */}
            <View style={styles.conditionCard}>
              <Text style={styles.conditionTitle}>🚗 Vehicle Return Report</Text>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Condition:</Text>
                <Text style={[styles.conditionVal, { color: condConf.color }]}>
                  {condConf.label}
                </Text>
              </View>

              {parseFloat(refundData.late_hours) > 0 && (
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Late Return:</Text>
                  <Text style={[styles.conditionVal, { color: COLORS.orange }]}>
                    {parseFloat(refundData.late_hours).toFixed(1)} hours
                  </Text>
                </View>
              )}

              {refundData.damage_description ? (
                <View style={styles.damageBox}>
                  <Text style={styles.damageBoxTitle}>📋 Inspector Notes:</Text>
                  <Text style={styles.damageBoxTxt}>{refundData.damage_description}</Text>
                </View>
              ) : null}

              {refundData.vehicle_returned_at && (
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Returned at:</Text>
                  <Text style={styles.conditionVal}>
                    {new Date(refundData.vehicle_returned_at).toLocaleString('en-PK')}
                  </Text>
                </View>
              )}
            </View>

            {/* Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>📅 Refund Timeline</Text>
              {[
                {
                  label: 'Vehicle Returned',
                  done:  !!refundData.vehicle_returned_at,
                  time:  refundData.vehicle_returned_at
                    ? new Date(refundData.vehicle_returned_at).toLocaleString('en-PK') : null,
                },
                {
                  label: 'Inspection Completed',
                  done:  ['approved','processing','completed'].includes(status),
                  time:  null,
                },
                {
                  label: 'Refund Approved',
                  done:  ['approved','processing','completed'].includes(status),
                  time:  null,
                },
                {
                  label: 'Refund Processing',
                  done:  ['processing','completed'].includes(status),
                  time:  refundData.refund_processed_at
                    ? new Date(refundData.refund_processed_at).toLocaleString('en-PK') : null,
                },
                {
                  label: 'Amount Credited',
                  done:  status === 'completed',
                  time:  null,
                },
              ].map((item, i) => (
                <View key={i} style={styles.tlRow}>
                  <View style={styles.tlDotCol}>
                    <View style={[
                      styles.tlDot,
                      item.done
                        ? { backgroundColor: COLORS.green }
                        : { backgroundColor: 'rgba(255,255,255,0.15)' },
                    ]} />
                    {i < 4 && (
                      <View style={[
                        styles.tlLine,
                        item.done && { backgroundColor: COLORS.green + '60' },
                      ]} />
                    )}
                  </View>
                  <View style={styles.tlContent}>
                    <Text style={[
                      styles.tlLabel,
                      item.done ? { color: COLORS.white } : { color: COLORS.textMuted },
                    ]}>
                      {item.done ? '✓ ' : '○ '}{item.label}
                    </Text>
                    {item.time && (
                      <Text style={styles.tlTime}>{item.time}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Dispute button */}
            <View style={styles.disputeCard}>
              <Text style={styles.disputeTitle}>Disagree with deductions?</Text>
              <Text style={styles.disputeDesc}>
                Contact our support within 24 hours of vehicle return.
              </Text>
              <TouchableOpacity style={styles.disputeBtn}>
                <Text style={styles.disputeBtnTxt}>📞 Contact Support</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.navy },
  blob1:          { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(46,134,222,0.1)', top: -80, right: -80 },
  blob2:          { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(79,195,247,0.06)', bottom: 100, left: -60 },
  loadingWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:     { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
  scrollContent:  { padding: 16, paddingTop: 8 },

  // Header
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:        { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:     { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  topTitle:       { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  refreshBtn:     { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  refreshTxt:     { color: COLORS.light, fontSize: 20, fontWeight: '700' },

  // Booking strip
  bookingStrip:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.glass, borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  bookingStripIcon: { fontSize: 28 },
  bookingStripModel:{ color: COLORS.white, fontSize: 15, fontWeight: '700' },
  bookingStripSub:  { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  // Pending state
  pendingCard:    { backgroundColor: COLORS.glass, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center' },
  pendingIcon:    { fontSize: 56, marginBottom: 12 },
  pendingTitle:   { color: COLORS.white, fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  pendingDesc:    { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  depositReminder:{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(38,208,124,0.1)', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.green + '30', width: '100%', marginBottom: 16 },
  depositReminderLeft:  { flex: 1 },
  depositReminderLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
  depositReminderAmt:   { color: COLORS.green, fontSize: 24, fontWeight: '900', marginBottom: 2 },
  depositReminderSub:   { color: COLORS.textMuted, fontSize: 11 },
  depositReminderIcon:  { fontSize: 36 },
  conditionsCard: { backgroundColor: 'rgba(46,134,222,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.accent + '30', width: '100%' },
  conditionsTitle:{ color: COLORS.light, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  condRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  condDot:        { width: 7, height: 7, borderRadius: 3.5 },
  condTxt:        { color: COLORS.textMuted, fontSize: 12 },

  // Status banner
  statusBanner:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 16 },
  statusBannerIcon:  { fontSize: 28 },
  statusBannerLabel: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  statusBannerDesc:  { color: COLORS.textMuted, fontSize: 12 },

  // Refund circle
  circleWrap:     { alignItems: 'center', marginBottom: 20 },
  circleBg:       { width: 190, height: 190, borderRadius: 95, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  circleInner:    { width: 165, height: 165, borderRadius: 82, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.navy },
  circleEmoji:    { fontSize: 28, marginBottom: 4 },
  circleAmt:      { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  circleLabel:    { color: COLORS.textMuted, fontSize: 11, marginBottom: 3 },
  circlePct:      { fontSize: 12, fontWeight: '700' },

  // Breakdown
  breakdownCard:  { backgroundColor: COLORS.glass, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  breakdownTitle: { color: COLORS.white, fontSize: 14, fontWeight: '800', marginBottom: 14 },
  breakdownRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  breakdownLabel: { color: COLORS.textMuted, fontSize: 13 },
  breakdownVal:   { fontSize: 13, fontWeight: '700' },
  breakdownDivider:{ borderTopWidth: 1, borderTopColor: COLORS.glassBorder, marginVertical: 10 },
  deductionsSection:{ backgroundColor: 'rgba(255,71,87,0.06)', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.red + '20' },
  deductionsTitle:{ color: COLORS.red, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  deductRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  deductDot:      { width: 6, height: 6, borderRadius: 3 },
  deductLabel:    { flex: 1, color: COLORS.textMuted, fontSize: 12 },
  deductAmt:      { fontSize: 12, fontWeight: '700' },
  deductTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.red + '25' },
  deductTotalLabel:{ color: COLORS.white, fontSize: 12, fontWeight: '700' },
  deductTotalAmt: { fontSize: 12, fontWeight: '700' },
  methodRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  methodLabel:    { color: COLORS.textMuted, fontSize: 12 },
  methodVal:      { fontSize: 12, fontWeight: '700' },

  // Condition card
  conditionCard:  { backgroundColor: COLORS.glass, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  conditionTitle: { color: COLORS.white, fontSize: 14, fontWeight: '800', marginBottom: 12 },
  conditionRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  conditionLabel: { color: COLORS.textMuted, fontSize: 13 },
  conditionVal:   { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  damageBox:      { backgroundColor: 'rgba(255,71,87,0.08)', borderRadius: 10, padding: 10, marginVertical: 8, borderWidth: 1, borderColor: COLORS.red + '25' },
  damageBoxTitle: { color: COLORS.red, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  damageBoxTxt:   { color: COLORS.textMuted, fontSize: 12, lineHeight: 17 },

  // Timeline
  timelineCard:   { backgroundColor: COLORS.glass, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  timelineTitle:  { color: COLORS.white, fontSize: 14, fontWeight: '800', marginBottom: 14 },
  tlRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 0 },
  tlDotCol:       { alignItems: 'center', width: 18 },
  tlDot:          { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  tlLine:         { width: 2, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 2 },
  tlContent:      { flex: 1, paddingBottom: 18 },
  tlLabel:        { fontSize: 13, fontWeight: '600' },
  tlTime:         { color: COLORS.textMuted, fontSize: 10, marginTop: 3 },

  // Dispute
  disputeCard:    { backgroundColor: 'rgba(255,71,87,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.red + '30', alignItems: 'center' },
  disputeTitle:   { color: COLORS.white, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  disputeDesc:    { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 12 },
  disputeBtn:     { backgroundColor: 'rgba(255,71,87,0.2)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.red + '50' },
  disputeBtnTxt:  { color: COLORS.red, fontWeight: '700', fontSize: 13 },
});