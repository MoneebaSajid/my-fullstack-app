import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  StatusBar, Dimensions
} from 'react-native';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

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
};

export default function PaymentScreen({ route, navigation }) {
  const { booking_id, booking_type, total_amount, receipt_number, fare_details } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState(null);

  const paymentMethods = [
    { id: 1, name: 'JazzCash', icon: '📱', color: '#c8102e' },
    { id: 2, name: 'Easypaisa', icon: '💚', color: '#00a651' },
    { id: 5, name: 'Bank Transfer', icon: '🏦', color: '#003087' },
    { id: 7, name: 'Visa', icon: '💳', color: '#1a1f71' },
    { id: 8, name: 'Mastercard', icon: '💳', color: '#eb001b' },
    { id: 9, name: 'HBL Pay', icon: '🏧', color: '#006400' },
  ];

  const handlePayment = async () => {
    if (!selectedGateway) {
      Alert.alert('Error', 'Please select a payment method!');
      return;
    }

    setLoading(true);
    try {
      await api.post('/payments/create', {
        booking_with_driver_id: booking_type === 'with-driver' ? booking_id : null,
        booking_without_driver_id: booking_type === 'without-driver' ? booking_id : null,
        gateway_id: selectedGateway.id,
        amount: total_amount,
        currency: 'PKR',
        payment_method: selectedGateway.name,
        payment_type: 'full',
        transaction_reference: 'TXN-' + Date.now(),
        remarks: 'Full payment for booking'
      });

      Alert.alert(
        '✅ Payment Successful!',
        `Rs. ${total_amount} paid via ${selectedGateway.name}`,
        [{
          text: 'View Receipt',
          onPress: () => navigation.navigate('Receipt', {
            booking_id,
            booking_type,
            total_amount,
            receipt_number,
            fare_details,
            payment_method: selectedGateway.name,
          }),
        }]
      );

    } catch (error) {
      Alert.alert('Error',
        error.response?.data?.message ||
        error.message ||
        'Payment failed!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      
      {/* Decorative Background circles from NexRide theme */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.tagline}>Secure your premium ride</Text>
        </View>

        {/* Payment Summary Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Service</Text>
            <Text style={styles.value}>
              {booking_type === 'with-driver' ? 'Chauffeur Driven' : 'Self Drive'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value}>#{booking_id}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>Rs. {total_amount}</Text>
          </View>
        </View>

        {/* Payment Methods Section */}
        <View style={styles.methodsHeader}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
        </View>

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            activeOpacity={0.8}
            style={[
              styles.methodCard,
              selectedGateway?.id === method.id && styles.methodCardActive
            ]}
            onPress={() => setSelectedGateway(method)}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.iconBox, { backgroundColor: method.color + '20' }]}>
                <Text style={styles.methodIcon}>{method.icon}</Text>
              </View>
              <Text style={styles.methodName}>{method.name}</Text>
            </View>
            <View style={[
              styles.radio, 
              selectedGateway?.id === method.id && styles.radioActive
            ]}>
              {selectedGateway?.id === method.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payBtn, !selectedGateway && styles.payBtnDisabled]}
          onPress={handlePayment}
          disabled={loading || !selectedGateway}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.payTxt}>
              Pay Now · Rs. {total_amount}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.secureBadge}>
          <Text style={styles.secureTxt}>🔒 End-to-end encrypted payment</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  circle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(46,134,222,0.1)',
    top: -60,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(79,195,247,0.06)',
    bottom: 50,
    left: -60,
  },
  header: {
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    padding: 24,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  value: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.green,
  },
  methodsHeader: {
    marginBottom: 5,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 12,
    backgroundColor: COLORS.inputBg,
  },
  methodCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(46,134,222,0.12)',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  methodIcon: {
    fontSize: 22,
  },
  methodName: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: COLORS.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  payBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  payBtnDisabled: {
    backgroundColor: COLORS.blue,
    opacity: 0.5,
  },
  payTxt: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secureBadge: {
    marginTop: 20,
    alignItems: 'center',
  },
  secureTxt: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
