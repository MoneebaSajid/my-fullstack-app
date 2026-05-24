import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions
} from 'react-native';

const COLORS = {
  navy: '#0A1628', accent: '#2E86DE', light: '#4FC3F7',
  white: '#FFFFFF', glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  textMuted: 'rgba(255,255,255,0.55)',
  green: '#26D07C',
};

export default function ReceiptScreen({ route, navigation }) {
  const { booking_id, booking_type, total_amount, receipt_number, fare_details, payment_method } = route.params;

  const now = new Date();

  return (
    <View style={styles.container}>
      <View style={styles.circle1} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>

          {/* Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.logo}>🚗 NexRide</Text>
            <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
            <Text style={styles.receiptNum}>#{receipt_number}</Text>
          </View>

          {/* Divider */}
          <View style={styles.dottedLine} />

          {/* Details */}
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailVal}>
                {now.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailVal}>
                {now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID</Text>
              <Text style={styles.detailVal}>#{booking_id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking Type</Text>
              <Text style={styles.detailVal}>
                {booking_type === 'with-driver' ? '👨‍✈️ With Driver' : '🚗 Self Drive'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailVal}>{payment_method || 'Pending'}</Text>
            </View>
          </View>

          <View style={styles.dottedLine} />

          {/* Fare Breakdown */}
          <Text style={styles.breakdownTitle}>Fare Breakdown</Text>
{fare_details?.driver_fee > 0 && (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>👨‍✈️ Driver Fee</Text>
    <Text style={styles.detailVal}>Rs. {fare_details.driver_fee}</Text>
  </View>
)}
          {fare_details && (
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Base Fare ({fare_details.rate_type})
                </Text>
                <Text style={styles.detailVal}>Rs. {fare_details.base_fare || 0}</Text>
              </View>
              {fare_details.duration_label ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Calculation</Text>
                  <Text style={styles.detailVal}>{fare_details.duration_label}</Text>
                </View>
              ) : null}
              {fare_details.distance_km > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Distance Used
                  </Text>
                  <Text style={styles.detailVal}>{fare_details.distance_km} km</Text>
                </View>
              )}
              {fare_details.dynamic_pricing > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dynamic Pricing</Text>
                  <Text style={[styles.detailVal, { color: '#FF9500' }]}>
                    +Rs. {fare_details.dynamic_pricing || 0}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tax (5%)</Text>
                <Text style={styles.detailVal}>Rs. {fare_details.tax_amount || 0}</Text>
              </View>
            </View>
          )}

          <View style={styles.dottedLine} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PAID</Text>
            <Text style={styles.totalVal}>Rs. {total_amount}</Text>
          </View>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusTxt}>✅ PAYMENT SUCCESSFUL</Text>
          </View>

          <View style={styles.dottedLine} />

          {/* Footer */}
          <Text style={styles.footer}>
            Thank you for choosing NexRide!{'\n'}
            For support: support@nexride.pk{'\n'}
            GC University Faisalabad — FYP 2025
          </Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('PassengerHome')}
        >
          <Text style={styles.homeBtnTxt}>🏠 Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookingsBtn}
          onPress={() => navigation.navigate('MyBookings')}
        >
          <Text style={styles.bookingsBtnTxt}>📋 My Bookings</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(46,134,222,0.1)', top: -60, right: -60 },
  scroll: { padding: 16, paddingTop: 30 },
  receiptCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 16 },
  receiptHeader: { alignItems: 'center', marginBottom: 16 },
  logo: { fontSize: 24, fontWeight: '800', color: COLORS.accent, marginBottom: 4 },
  receiptTitle: { fontSize: 13, fontWeight: '700', color: '#666', letterSpacing: 2, marginBottom: 4 },
  receiptNum: { fontSize: 12, color: '#999', fontFamily: 'monospace' },
  dottedLine: { borderBottomWidth: 1, borderBottomColor: '#ddd', borderStyle: 'dashed', marginVertical: 14 },
  detailSection: { marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 2 },
  detailLabel: { fontSize: 13, color: '#666' },
  detailVal: { fontSize: 13, color: '#333', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 },
  breakdownTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#333' },
  totalVal: { fontSize: 22, fontWeight: '800', color: COLORS.accent },
  statusBadge: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 8 },
  statusTxt: { color: '#2E7D32', fontWeight: '800', fontSize: 13 },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, lineHeight: 18, marginTop: 10 },
  homeBtn: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  homeBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  bookingsBtn: { backgroundColor: COLORS.glass, padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  bookingsBtnTxt: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
