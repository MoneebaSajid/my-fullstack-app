import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  navy: '#0A1628',
  blue: '#1A3C6E',
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
};

const DEPOSIT_AMOUNT = 2000;

// ── Expandable FAQ Item ──
const FAQItem = ({ question, answer, accent = COLORS.accent }) => {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(anim, {
      toValue: open ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setOpen(!open);
  };

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.faqItem, { borderColor: accent + '40' }]}>
      <TouchableOpacity style={styles.faqHeader} onPress={toggle} activeOpacity={0.8}>
        <Text style={styles.faqQ}>{question}</Text>
        <Animated.Text style={[styles.faqChevron, { transform: [{ rotate }] }]}>
          ▼
        </Animated.Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.faqBody}>
          <Text style={styles.faqA}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

// ── Condition Row ──
const CondRow = ({ icon, text, color = COLORS.textMuted }) => (
  <View style={styles.condRow}>
    <Text style={[styles.condIcon, { color }]}>{icon}</Text>
    <Text style={[styles.condText, { color }]}>{text}</Text>
  </View>
);

// ── Section Header ──
const SectionHeader = ({ emoji, title, color = COLORS.accent }) => (
  <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
    <Text style={styles.sectionEmoji}>{emoji}</Text>
    <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
  </View>
);

export default function RefundPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      
      {/* Background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Refund Policy</Text>
        <View style={{ width: 38 }} />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO CARD ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroIcon}>🛡️</Text>
          <Text style={styles.heroTitle}>NexRide Refund Policy</Text>
          <Text style={styles.heroSub}>
            Your deposit is fully protected. We believe in fair, transparent
            returns — no hidden deductions.
          </Text>
          <View style={styles.heroBadgeRow}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(38,208,124,0.2)', borderColor: COLORS.green + '50' }]}>
              <Text style={[styles.heroBadgeTxt, { color: COLORS.green }]}>✓ 100% Refundable Deposit</Text>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(46,134,222,0.2)', borderColor: COLORS.accent + '50' }]}>
              <Text style={[styles.heroBadgeTxt, { color: COLORS.light }]}>⏱ Within 3–5 Days</Text>
            </View>
          </View>
        </View>
        
        {/* ── DEPOSIT SUMMARY ── */}
        <View style={styles.depositCard}>
          <View style={styles.depositLeft}>
            <Text style={styles.depositLabel}>Refundable Deposit</Text>
            <Text style={styles.depositAmount}>Rs. {DEPOSIT_AMOUNT.toLocaleString()}</Text>
            <Text style={styles.depositSub}>Collected at booking time</Text>
          </View>
          <View style={styles.depositRight}>
            <Text style={styles.depositIcon}>💰</Text>
            <Text style={styles.depositStatus}>PROTECTED</Text>
          </View>
        </View>

        {/* ── WHAT IS REFUNDED ── */}
        <SectionHeader emoji="✅" title="What You Get Back" color={COLORS.green} />
        <View style={[styles.card, { borderColor: COLORS.green + '30' }]}>
          <Text style={styles.cardSubtitle}>
            Upon successful trip completion, the following amounts are refunded:
          </Text>
          <View style={styles.refundTable}>
            {/* Header */}
            <View style={styles.refundTableHeader}>
              <Text style={[styles.refundTableCell, styles.refundTableHeadTxt, { flex: 2 }]}>
                Component
              </Text>
              <Text style={[styles.refundTableCell, styles.refundTableHeadTxt, { flex: 1, textAlign: 'right' }]}>
                Refund
              </Text>
            </View>
            {[
              { label: 'Security Deposit (Rs. 2,000)', value: '100% ✓', color: COLORS.green },
              { label: 'Base Fare (Duration Charge)', value: '0% ✗', color: COLORS.textMuted, note: 'Service rendered' },
              { label: 'Distance Charge (Per KM)', value: '0% ✗', color: COLORS.textMuted, note: 'Fuel & wear' },
              { label: 'Driver Fee (if selected)', value: '0% ✗', color: COLORS.textMuted, note: 'Driver service' },
              { label: 'GST / Tax', value: '0% ✗', color: COLORS.textMuted, note: 'Government levy' },
            ].map((row, i) => (
              <View key={i} style={[styles.refundTableRow, i % 2 === 0 && styles.refundTableRowAlt]}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.refundTableCell}>{row.label}</Text>
                  {row.note && <Text style={styles.refundTableNote}>{row.note}</Text>}
                </View>
                <Text style={[styles.refundTableCell, { flex: 1, textAlign: 'right', color: row.color, fontWeight: '700' }]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTxt}>
              💡 Only the <Text style={{ color: COLORS.green, fontWeight: '700' }}>Security Deposit (Rs. {DEPOSIT_AMOUNT})</Text> is refundable.
              Fare charges are non-refundable as they cover the actual service rendered.
            </Text>
          </View>
        </View>

        {/* ── FULL REFUND CONDITIONS ── */}
        <SectionHeader emoji="🚗" title="Full Deposit Refund — Conditions" color={COLORS.green} />
        <View style={[styles.card, { borderColor: COLORS.green + '30' }]}>
          <Text style={styles.cardSubtitle}>
            You receive <Text style={{ color: COLORS.green, fontWeight: '700' }}>Rs. {DEPOSIT_AMOUNT} back in full</Text> when ALL of the following are met:
          </Text>
          <CondRow icon="✅" color={COLORS.green} text="Vehicle returned on or before the agreed end time" />
          <CondRow icon="✅" color={COLORS.green} text="Exterior is free of new scratches, dents, or damage" />
          <CondRow icon="✅" color={COLORS.green} text="Interior is clean — no stains, tears, or foul odour" />
          <CondRow icon="✅" color={COLORS.green} text="All accessories (spare tyre, jack, charger) are returned" />
          <CondRow icon="✅" color={COLORS.green} text="Fuel level matches or exceeds the level at handover" />
          <CondRow icon="✅" color={COLORS.green} text="No traffic fines or toll violations incurred during rental" />
          <CondRow icon="✅" color={COLORS.green} text="Trip status marked 'Completed' in the NexRide app" />
          <View style={[styles.infoBox, { backgroundColor: 'rgba(38,208,124,0.08)', borderColor: COLORS.green + '30' }]}>
            <Text style={styles.infoTxt}>
              🔍 Our team conducts a quick <Text style={{ color: COLORS.green, fontWeight: '700' }}>vehicle inspection</Text> at return.
              If everything checks out, refund is processed within{' '}
              <Text style={{ color: COLORS.green, fontWeight: '700' }}>3–5 business days.</Text>
            </Text>
          </View>
        </View>

        {/* ── PARTIAL REFUND ── */}
        <SectionHeader emoji="⚠️" title="Partial Refund Scenarios" color={COLORS.orange} />
        <View style={[styles.card, { borderColor: COLORS.orange + '30' }]}>
          <Text style={styles.cardSubtitle}>
            In some cases, a <Text style={{ color: COLORS.orange, fontWeight: '700' }}>partial refund</Text> may be issued after
            deducting the cost of damage or service:
          </Text>
          {[
            { icon: '🔧', title: 'Minor Damage', desc: 'Small scratches or dents — repair cost deducted from deposit. Remaining balance refunded.' },
            { icon: '🧹', title: 'Interior Cleaning Required', desc: 'Professional cleaning fee (Rs. 300–800) deducted. Balance refunded.' },
            { icon: '⛽', title: 'Fuel Shortfall', desc: 'Cost of missing fuel deducted at market rate. Balance refunded.' },
            { icon: '⏰', title: 'Late Return (< 2 hours)', desc: 'Rs. 200/hour late fee deducted. Remaining deposit refunded.' },
          ].map((item, i) => (
            <View key={i} style={styles.scenarioItem}>
              <Text style={styles.scenarioIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.scenarioTitle}>{item.title}</Text>
                <Text style={styles.scenarioDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── NO REFUND ── */}
        <SectionHeader emoji="❌" title="No Refund Scenarios" color={COLORS.red} />
        <View style={[styles.card, { borderColor: COLORS.red + '30' }]}>
          <Text style={styles.cardSubtitle}>
            The deposit is <Text style={{ color: COLORS.red, fontWeight: '700' }}>forfeited entirely</Text> in the following cases:
          </Text>
          <CondRow icon="❌" color={COLORS.red} text="Major accident damage caused by the passenger" />
          <CondRow icon="❌" color={COLORS.red} text="Vehicle returned more than 2 hours late without prior notice" />
          <CondRow icon="❌" color={COLORS.red} text="Vehicle used outside the agreed geographic area" />
          <CondRow icon="❌" color={COLORS.red} text="Illegal activity conducted using the vehicle" />
          <CondRow icon="❌" color={COLORS.red} text="Vehicle returned with missing parts or accessories" />
          <CondRow icon="❌" color={COLORS.red} text="Passenger caused total loss or theft of the vehicle" />
          <View style={[styles.infoBox, { backgroundColor: 'rgba(255,71,87,0.08)', borderColor: COLORS.red + '30' }]}>
            <Text style={[styles.infoTxt, { color: COLORS.textMuted }]}>
              ⚖️ In cases of major damage, additional charges <Text style={{ color: COLORS.red }}>beyond the deposit</Text> may be applied as per Pakistan road liability laws.
            </Text>
          </View>
        </View>

        {/* ── CANCELLATION POLICY ── */}
        <SectionHeader emoji="📅" title="Booking Cancellation Refund" color={COLORS.light} />
        <View style={[styles.card, { borderColor: COLORS.light + '30' }]}>
          <Text style={styles.cardSubtitle}>
            If you cancel your booking <Text style={{ fontWeight: '700', color: COLORS.white }}>before the trip starts:</Text>
          </Text>
          <View style={styles.timelineContainer}>
            {[
              { time: '24+ hrs before', refund: '100%', color: COLORS.green, icon: '🟢', desc: 'Full deposit returned' },
              { time: '12–24 hrs before', refund: '50%', color: COLORS.orange, icon: '🟡', desc: 'Rs. 1,000 returned' },
              { time: '6–12 hrs before', refund: '25%', color: COLORS.orange, icon: '🟠', desc: 'Rs. 500 returned' },
              { time: 'Under 6 hrs', refund: '0%', color: COLORS.red, icon: '🔴', desc: 'No refund' },
            ].map((item, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineDotCol}>
                  <Text style={styles.timelineDot}>{item.icon}</Text>
                  {i < 3 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineTop}>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                    <View style={[styles.timelineRefundBadge, { backgroundColor: item.color + '25', borderColor: item.color + '50' }]}>
                      <Text style={[styles.timelineRefundTxt, { color: item.color }]}>{item.refund} refund</Text>
                    </View>
                  </View>
                  <Text style={styles.timelineDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── REFUND PROCESS ── */}
        <SectionHeader emoji="💳" title="How Refund is Processed" color={COLORS.accent} />
        <View style={[styles.card, { borderColor: COLORS.accent + '30' }]}>
          {[
            { step: '01', title: 'Vehicle Returned', desc: 'You return the vehicle and our team completes an inspection', icon: '🚗' },
            { step: '02', title: 'Inspection Report', desc: 'A vehicle condition report is generated and shared with you', icon: '📋' },
            { step: '03', title: 'Refund Decision', desc: 'Based on condition, refund amount is calculated and approved', icon: '✅' },
            { step: '04', title: 'Amount Credited', desc: 'Refund sent to original payment method within 3–5 business days', icon: '💰' },
          ].map((item, i) => (
            <View key={i} style={styles.processStep}>
              <View style={styles.processStepNum}>
                <Text style={styles.processStepNumTxt}>{item.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.processTitle}>
                  {item.icon} {item.title}
                </Text>
                <Text style={styles.processDesc}>{item.desc}</Text>
              </View>
              {i < 3 && <View style={styles.processConnector} />}
            </View>
          ))}
          <View style={[styles.infoBox, { marginTop: 8 }]}>
            <Text style={styles.infoTxt}>
              📱 Refund method: Same gateway used for payment (JazzCash → JazzCash, Card → Card, etc.)
            </Text>
          </View>
        </View>

        {/* ── FAQ ── */}
        <SectionHeader emoji="❓" title="Frequently Asked Questions" color={COLORS.yellow} />
        <View style={{ marginBottom: 12 }}>
          <FAQItem
            accent={COLORS.yellow}
            question="Can I dispute a damage deduction?"
            answer="Yes! If you disagree with the damage assessment, contact NexRide support within 24 hours of return. We will review the pre-trip and post-trip photos and resolve the dispute within 48 hours."
          />
          <FAQItem
            accent={COLORS.yellow}
            question="What if I return the vehicle early?"
            answer="Early returns are accepted with no penalty. If you return significantly early (more than 2 hours), we may issue a partial refund of unused fare at our discretion. The full deposit is still returned."
          />
          <FAQItem
            accent={COLORS.yellow}
            question="Is there a pre-trip inspection?"
            answer="Yes. Before you receive the vehicle, our team documents its condition with photos. This protects both you and NexRide — any pre-existing damage will not be charged to you."
          />
          <FAQItem
            accent={COLORS.yellow}
            question="What if the refund is delayed beyond 5 days?"
            answer="Please contact our support team. Bank processing times can vary. JazzCash and Easypaisa refunds typically arrive within 1–2 days. Card refunds may take 5–7 banking days."
          />
          <FAQItem
            accent={COLORS.yellow}
            question="What if the vehicle breaks down — do I get a refund?"
            answer="If the vehicle breaks down due to a pre-existing mechanical fault (not passenger negligence), you are entitled to a proportional fare refund for unused time, and your full deposit is returned."
          />
        </View>

        {/* ── CONTACT CARD ── */}
        <View style={styles.contactCard}>
          <Text style={styles.contactIcon}>📞</Text>
          <Text style={styles.contactTitle}>Need Help With a Refund?</Text>
          <Text style={styles.contactSub}>
            Our support team is available 9 AM – 9 PM, 7 days a week.
          </Text>
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>📱 WhatsApp</Text>
              <Text style={styles.contactVal}>+92-300-NEXRIDE</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>✉️ Email</Text>
              <Text style={styles.contactVal}>support@nexride.pk</Text>
            </View>
          </View>
        </View>

        {/* ── BOTTOM NOTE ── */}
        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteTxt}>
            📄 This policy is effective as of the booking date. NexRide reserves
            the right to amend this policy with 7-day prior notice to registered
            users. By confirming a booking, you agree to these terms.
          </Text>
          <Text style={styles.versionTxt}>Policy Version 1.0 · NexRide Pvt Ltd · Pakistan</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  blob1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(46,134,222,0.1)',
    top: -80,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(79,195,247,0.06)',
    bottom: 200,
    left: -60,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnTxt: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  topTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  // Hero
  heroCard: {
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroBadgeTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Deposit card
  depositCard: {
    backgroundColor: 'rgba(38,208,124,0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.green + '40',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  depositLeft: {
    flex: 1,
  },
  depositLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  depositAmount: {
    color: COLORS.green,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 3,
  },
  depositSub: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  depositRight: {
    alignItems: 'center',
    gap: 6,
  },
  depositIcon: {
    fontSize: 36,
  },
  depositStatus: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderRadius: 2,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  // Refund table
  refundTable: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  refundTableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(46,134,222,0.2)',
    padding: 10,
  },
  refundTableHeadTxt: {
    color: COLORS.light,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refundTableRow: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  refundTableRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  refundTableCell: {
    color: COLORS.white,
    fontSize: 12,
  },
  refundTableNote: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
    fontStyle: 'italic',
  },
  // Info box
  infoBox: {
    backgroundColor: 'rgba(46,134,222,0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(46,134,222,0.25)',
  },
  infoTxt: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  // Condition rows
  condRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  condIcon: {
    fontSize: 14,
    marginTop: 1,
    width: 20,
  },
  condText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  // Scenario items
  scenarioItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
    backgroundColor: 'rgba(255,149,0,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.orange + '25',
  },
  scenarioIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  scenarioTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  scenarioDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  // Timeline
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    fontSize: 16,
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTime: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  timelineRefundBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  timelineRefundTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  timelineDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  // Process steps
  processStep: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 8,
    paddingBottom: 8,
  },
  processStepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  processStepNumTxt: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  processTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
    marginTop: 2,
  },
  processDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  processConnector: {
    position: 'absolute',
    left: 17,
    top: 40,
    width: 2,
    height: 24,
    backgroundColor: 'rgba(46,134,222,0.3)',
  },
  // FAQ
  faqItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqQ: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    paddingRight: 8,
  },
  faqChevron: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  faqBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  faqA: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  // Contact card
  contactCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  contactIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  contactTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  contactSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  contactItem: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  contactLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  contactVal: {
    color: COLORS.light,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Bottom
  bottomNote: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bottomNoteTxt: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 8,
  },
  versionTxt: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    textAlign: 'center',
  },
});