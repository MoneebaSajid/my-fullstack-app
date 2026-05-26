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

// import React, { useState } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity,
//   StyleSheet, ActivityIndicator, Alert, ScrollView,
//   Dimensions, KeyboardAvoidingView, Platform
// } from 'react-native';
// import api from '../../services/api';

// const { width } = Dimensions.get('window');

// const COLORS = {
//   navy: '#0A1628', accent: '#2E86DE', light: '#4FC3F7',
//   white: '#FFFFFF', glass: 'rgba(255,255,255,0.08)',
//   glassBorder: 'rgba(255,255,255,0.15)',
//   inputBg: 'rgba(255,255,255,0.06)',
//   textMuted: 'rgba(255,255,255,0.55)',
//   green: '#26D07C', red: '#FF4757', orange: '#FF9500',
// };

// const GATEWAYS = [
//   { id: 'jazzcash',      label: 'JazzCash',      icon: '📱', color: '#D32F2F', fee: '2.5%',  fields: 'mobile' },
//   { id: 'easypaisa',     label: 'Easypaisa',     icon: '💚', color: '#2E7D32', fee: '2.0%',  fields: 'mobile' },
//   { id: 'hbl',           label: 'HBL Pay',       icon: '🏦', color: '#1565C0', fee: '1.5%',  fields: 'bank'   },
//   { id: 'visa',          label: 'Visa',          icon: '💳', color: '#1A237E', fee: '2.7%',  fields: 'card'   },
//   { id: 'mastercard',    label: 'Mastercard',    icon: '💳', color: '#B71C1C', fee: '2.6%',  fields: 'card'   },
//   { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏛️', color: '#4A148C', fee: '0%',    fields: 'bank'   },
// ];

// export default function PaymentScreen({ route, navigation }) {
//   const { booking_id, booking_type, total_amount, receipt_number, fare_details } = route.params;
  
//   const [selectedGateway, setSelectedGateway]   = useState(null);
//   const [loading,         setLoading]           = useState(false);
//   const [step,            setStep]              = useState('select'); // 'select' | 'form' | 'otp'
  
//   const [otp,             setOtp]               = useState('');
//   const [generatedOtp,    setGeneratedOtp]      = useState('');
  
//   // Form fields
//   const [mobileNumber,    setMobileNumber]      = useState('');
//   const [mpin,            setMpin]              = useState('');
//   const [cardNumber,      setCardNumber]        = useState('');
//   const [cardHolder,      setCardHolder]        = useState('');
//   const [expiry,          setExpiry]            = useState('');
//   const [cvv,             setCvv]               = useState('');
//   const [accountTitle,    setAccountTitle]      = useState('');
//   const [accountNumber,   setAccountNumber]     = useState('');
//   const [bankName,        setBankName]          = useState('');
//   const [cnic,            setCnic]              = useState('');

//   const gateway = GATEWAYS.find(g => g.id === selectedGateway);

//   // ── Format card number with spaces ──
//   const formatCardNumber = (val) => {
//     const cleaned = val.replace(/\D/g, '').slice(0, 16);
//     return cleaned.replace(/(.{4})/g, '$1 ').trim();
//   };

//   // ── Format expiry MM/YY ──
//   const formatExpiry = (val) => {
//     const cleaned = val.replace(/\D/g, '').slice(0, 4);
//     if (cleaned.length >= 3) return cleaned.slice(0,2) + '/' + cleaned.slice(2);
//     return cleaned;
//   };

//   // ── Format CNIC ──
//   const formatCnic = (val) => {
//     const cleaned = val.replace(/\D/g, '').slice(0, 13);
//     if (cleaned.length > 12) return `${cleaned.slice(0,5)}-${cleaned.slice(5,12)}-${cleaned.slice(12)}`;
//     if (cleaned.length > 5)  return `${cleaned.slice(0,5)}-${cleaned.slice(5)}`;
//     return cleaned;
//   };

//   // ── Validate form before proceeding ──
//   const validateForm = () => {
//     if (!gateway) return false;

//     if (gateway.fields === 'mobile') {
//       if (!mobileNumber || mobileNumber.replace(/\D/g,'').length < 11) {
//         Alert.alert('Invalid', 'Please enter a valid 11-digit mobile number!');
//         return false;
//       }
//       if (!mpin || mpin.length < 4) {
//         Alert.alert('Invalid', 'Please enter your 4-digit MPIN!');
//         return false;
//       }
//     }

//     if (gateway.fields === 'card') {
//       if (!cardNumber || cardNumber.replace(/\s/g,'').length < 16) {
//         Alert.alert('Invalid', 'Please enter a valid 16-digit card number!');
//         return false;
//       }
//       if (!cardHolder.trim()) {
//         Alert.alert('Invalid', 'Please enter the card holder name!');
//         return false;
//       }
//       if (!expiry || expiry.length < 5) {
//         Alert.alert('Invalid', 'Please enter card expiry (MM/YY)!');
//         return false;
//       }
//       if (!cvv || cvv.length < 3) {
//         Alert.alert('Invalid', 'Please enter a valid CVV!');
//         return false;
//       }
//     }

//     if (gateway.fields === 'bank') {
//       if (!accountTitle.trim()) {
//         Alert.alert('Invalid', 'Please enter account title!');
//         return false;
//       }
//       if (!accountNumber || accountNumber.length < 10) {
//         Alert.alert('Invalid', 'Please enter a valid account number!');
//         return false;
//       }
//     }

//     return true;
//   };

//   // ── Proceed to OTP ──
//   const handleProceed = () => {
//     if (!validateForm()) return;

//     // Generate 6-digit OTP
//     const newOtp = String(Math.floor(100000 + Math.random() * 900000));
//     setGeneratedOtp(newOtp);
//     setStep('otp');

//     // In real app this would be SMS — here we show it as confirmation alert
//     Alert.alert(
//       '🔐 OTP Sent!',
//       `Your verification code: ${newOtp}\n\n(In production, this is sent via SMS)`,
//       [{ text: 'OK' }]
//     );
//   };

//   // ── Verify OTP and process payment ──
//   const handleVerifyAndPay = async () => {
//     if (otp !== generatedOtp) {
//       Alert.alert('Invalid OTP', 'The code you entered is incorrect. Please try again.');
//       return;
//     }

//     setLoading(true);
//     try {
//       // Process payment via API
//       const response = await api.post('/payments/create', {
//         booking_id,
//         booking_type,
//         payment_method: selectedGateway,
//         amount: total_amount,
//         currency: 'PKR',
//         transaction_ref: `NXR-${Date.now()}`,
//         payment_details: getPaymentDetails(),
//       });

//       // Update receipt status
//       try {
//         await api.put(`/receipts/update-payment`, {
//           receipt_number,
//           payment_method: selectedGateway,
//           payment_status: 'completed',
//         });
//       } catch (_) {}

//       Alert.alert(
//         '✅ Payment Successful!',
//         `Rs. ${total_amount} paid via ${gateway?.label}\n` +
//         `Transaction: ${response.data?.transaction_ref || `NXR-${Date.now()}`}`,
//         [{
//           text: 'View Receipt',
//           onPress: () => navigation.navigate('Receipt', {
//             booking_id,
//             booking_type,
//             total_amount,
//             receipt_number,
//             fare_details,
//             payment_method: gateway?.label,
//           }),
//         }]
//       );

//     } catch (error) {
//       Alert.alert('Payment Failed',
//         error.response?.data?.message || 'Payment could not be processed. Try again!'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getPaymentDetails = () => {
//     if (!gateway) return {};
//     if (gateway.fields === 'mobile') return { mobile: mobileNumber };
//     if (gateway.fields === 'card')   return { last4: cardNumber.slice(-4), holder: cardHolder };
//     if (gateway.fields === 'bank')   return { account: accountNumber, title: accountTitle };
//     return {};
//   };

//   // ═══════════════════════════════════
//   // STEP 1 — Select Gateway
//   // ═══════════════════════════════════
//   if (step === 'select') {
//     return (
//       <View style={styles.container}>
//         <View style={styles.circle1} />
//         <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
//           {/* Amount Card */}
//           <View style={styles.amountCard}>
//             <Text style={styles.amountLabel}>Total Amount</Text>
//             <Text style={styles.amountValue}>Rs. {total_amount}</Text>
//             <Text style={styles.receiptNo}>Receipt: #{receipt_number}</Text>
//           </View>

//           {/* Fare Breakdown */}
//           {fare_details && (
//             <View style={styles.fareCard}>
//               <Text style={styles.fareTitle}>💰 Fare Breakdown</Text>
              
//               <View style={styles.fareRow}>
//                 <Text style={styles.fareLabel}>Base Fare</Text>
//                 <Text style={styles.fareVal}>Rs. {fare_details.base_fare || 0}</Text>
//               </View>
              
//               {fare_details.distance_charge > 0 && (
//                 <View style={styles.fareRow}>
//                   <Text style={styles.fareLabel}>Distance Charge</Text>
//                   <Text style={styles.fareVal}>Rs. {fare_details.distance_charge}</Text>
//                 </View>
//               )}
              
//               {fare_details.driver_fee > 0 && (
//                 <View style={styles.fareRow}>
//                   <Text style={styles.fareLabel}>Driver Fee</Text>
//                   <Text style={styles.fareVal}>Rs. {fare_details.driver_fee}</Text>
//                 </View>
//               )}
              
//               <View style={styles.fareDivider} />
              
//               <View style={styles.fareRow}>
//                 <Text style={styles.fareLabel}>Subtotal</Text>
//                 <Text style={styles.fareVal}>Rs. {fare_details.subtotal || 0}</Text>
//               </View>
              
//               <View style={styles.fareRow}>
//                 <Text style={styles.fareLabel}>Tax (5% GST)</Text>
//                 <Text style={styles.fareVal}>Rs. {fare_details.tax_amount || 0}</Text>
//               </View>
              
//               <View style={[styles.fareRow, { marginTop: 6 }]}>
//                 <Text style={[styles.fareLabel, { color: COLORS.white, fontWeight: '800' }]}>TOTAL</Text>
//                 <Text style={[styles.fareVal, { color: COLORS.green, fontSize: 16, fontWeight: '800' }]}>
//                   Rs. {total_amount}
//                 </Text>
//               </View>
//             </View>
//           )}

//           {/* Select Gateway */}
//           <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
//           <View style={styles.gatewaysGrid}>
//             {GATEWAYS.map((gw) => (
//               <TouchableOpacity
//                 key={gw.id}
//                 style={[
//                   styles.gatewayCard,
//                   selectedGateway === gw.id && styles.gatewayCardActive,
//                 ]}
//                 onPress={() => setSelectedGateway(gw.id)}
//               >
//                 <Text style={styles.gatewayIcon}>{gw.icon}</Text>
//                 <Text style={styles.gatewayLabel}>{gw.label}</Text>
//                 <Text style={styles.gatewayFee}>Fee: {gw.fee}</Text>
//                 {selectedGateway === gw.id && (
//                   <View style={styles.selectedCheck}>
//                     <Text style={styles.selectedCheckTxt}>✓</Text>
//                   </View>
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Buttons */}
//           <TouchableOpacity
//             style={[styles.proceedBtn, !selectedGateway && { opacity: 0.5 }]}
//             onPress={() => selectedGateway && setStep('form')}
//             disabled={!selectedGateway}
//           >
//             <Text style={styles.proceedBtnTxt}>Continue →</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.laterBtn}
//             onPress={() => {
//               Alert.alert(
//                 'Pay Later',
//                 'You can pay later from My Bookings screen.',
//                 [
//                   { text: 'Cancel', style: 'cancel' },
//                   { text: 'OK', onPress: () => navigation.navigate('MyBookings') }
//                 ]
//               );
//             }}
//           >
//             <Text style={styles.laterBtnTxt}>Pay Later</Text>
//           </TouchableOpacity>

//           <View style={{ height: 30 }} />
//         </ScrollView>
//       </View>
//     );
//   }

//   // ═══════════════════════════════════
//   // STEP 2 — Payment Form
//   // ═══════════════════════════════════
//   if (step === 'form') {
//     return (
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <View style={styles.circle1} />
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Back */}
//           <TouchableOpacity style={styles.backBtn} onPress={() => setStep('select')}>
//             <Text style={styles.backBtnTxt}>← Back</Text>
//           </TouchableOpacity>

//           {/* Gateway Header */}
//           <View style={[styles.gatewayHeader, { borderColor: gateway?.color + '60' }]}>
//             <Text style={styles.gatewayHeaderIcon}>{gateway?.icon}</Text>
//             <View>
//               <Text style={styles.gatewayHeaderLabel}>{gateway?.label}</Text>
//               <Text style={styles.gatewayHeaderFee}>Transaction fee: {gateway?.fee}</Text>
//             </View>
//             <View style={styles.gatewayHeaderAmount}>
//               <Text style={styles.gatewayHeaderAmountLabel}>Pay</Text>
//               <Text style={[styles.gatewayHeaderAmountVal, { color: COLORS.green }]}>
//                 Rs. {total_amount}
//               </Text>
//             </View>
//           </View>

//           {/* ── MOBILE PAYMENT FORM (JazzCash / Easypaisa) ── */}
//           {gateway?.fields === 'mobile' && (
//             <View style={styles.formCard}>
//               <Text style={styles.formTitle}>
//                 {gateway.id === 'jazzcash' ? '📱 JazzCash Details' : '💚 Easypaisa Details'}
//               </Text>
              
//               <Text style={styles.fieldLabel}>Registered Mobile Number *</Text>
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.inputPrefix}>🇵🇰 +92</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="03XXXXXXXXX"
//                   placeholderTextColor={COLORS.textMuted}
//                   value={mobileNumber}
//                   onChangeText={(val) => setMobileNumber(val.replace(/\D/g, '').slice(0, 11))}
//                   keyboardType="numeric"
//                   maxLength={11}
//                 />
//               </View>

//               <Text style={styles.fieldLabel}>MPIN (4-digit) *</Text>
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.inputIcon}>🔐</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter your MPIN"
//                   placeholderTextColor={COLORS.textMuted}
//                   value={mpin}
//                   onChangeText={(val) => setMpin(val.replace(/\D/g, '').slice(0, 4))}
//                   keyboardType="numeric"
//                   secureTextEntry
//                   maxLength={4}
//                 />
//               </View>

//               <Text style={styles.fieldLabel}>CNIC (for verification) *</Text>
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.inputIcon}>🪪</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="XXXXX-XXXXXXX-X"
//                   placeholderTextColor={COLORS.textMuted}
//                   value={cnic}
//                   onChangeText={(val) => setCnic(formatCnic(val))}
//                   keyboardType="numeric"
//                   maxLength={15}
//                 />
//               </View>

//               <View style={styles.infoBox}>
//                 <Text style={styles.infoTxt}>
//                   ℹ️ Make sure your {gateway.label} account is active and has sufficient balance of Rs. {total_amount}
//                 </Text>
//               </View>
//             </View>
//           )}

//           {/* ── CARD PAYMENT FORM (Visa / Mastercard) ── */}
//           {gateway?.fields === 'card' && (
//             <View style={styles.formCard}>
//               <Text style={styles.formTitle}>
//                 💳 {gateway.label} Card Details
//               </Text>
              
//               {/* Card Preview */}
//               <View style={[styles.cardPreview, { backgroundColor: gateway.id === 'visa' ? '#1A237E' : '#B71C1C' }]}>
//                 <Text style={styles.cardPreviewChip}>▪▪▪▪ ▪▪▪▪ ▪▪▪▪ {cardNumber.replace(/\s/g,'').slice(-4) || '▪▪▪▪'}</Text>
//                 <Text style={styles.cardPreviewHolder}>{cardHolder || 'CARD HOLDER NAME'}</Text>
//                 <View style={styles.cardPreviewBottom}>
//                   <Text style={styles.cardPreviewExpiry}>Expires: {expiry || 'MM/YY'}</Text>
//                   <Text style={styles.cardPreviewNetwork}>{gateway.label.toUpperCase()}</Text>
//                 </View>
//               </View>

//               <Text style={styles.fieldLabel}>Card Number *</Text>
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.inputIcon}>💳</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="XXXX XXXX XXXX XXXX"
//                   placeholderTextColor={COLORS.textMuted}
//                   value={cardNumber}
//                   onChangeText={(val) => setCardNumber(formatCardNumber(val))}
//                   keyboardType="numeric"
//                   maxLength={19}
//                 />
//               </View>

//               <Text style={styles.fieldLabel}>Card Holder Name *</Text>
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.inputIcon}>👤</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Name as on card"
//                   placeholderTextColor={COLORS.textMuted}
//                   value={cardHolder}
//                   onChangeText={(val) => setCardHolder(val.replace(/[^a-zA-Z\s]/g, '').toUpperCase())}
//                   autoCapitalize="characters"
//                   maxLength={30}
//                 />
//               </View>

//               <View style={styles.rowFields}>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.fieldLabel}>Expiry *</Text>
//                   <View style={[styles.inputWrapper, { marginRight: 8 }]}>
//                     <TextInput
//                       style={[styles.input, { paddingLeft: 12 }]}
//                       placeholder="MM/YY"
//                       placeholderTextColor={COLORS.textMuted}
//                       value={expiry}
//                       onChangeText={(val) => setExpiry(formatExpiry(val))}
//                       keyboardType="numeric"
//                       maxLength={5}
//                     />
//                   </View>
//                 </View>
                
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.fieldLabel}>CVV *</Text>
//                   <View style={styles.inputWrapper}>
//                     <TextInput
//                       style={[styles.input, { paddingLeft: 12 }]}
//                       placeholder="XXX"
//                       placeholderTextColor={COLORS.textMuted}
//                       value={cvv}
//                       onChangeText={(val) => setCvv(val.replace(/\D/g, '').slice(0, 4))}
//                       keyboardType="numeric"
//                       secureTextEntry
//                       maxLength={4}
//                     />
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.infoBox}>
//                 <Text style={styles.infoTxt}>
//                   🔒 Your card details are encrypted and secure. We never store your CVV.
//                 </Text>
//               </View>
//             </View>
//           )}

//           {/* ── BANK TRANSFER FORM (HBL / Bank Transfer) ── */}
//           {gateway?.fields === 'bank' && (
//             <View style={styles.formCard}>
//               <Text style={styles.formTitle}>
//                 🏦 {gateway.label} Details
//               </Text>
              
//               {gateway.id === 'bank_transfer' && (
//                 <View style={styles.bankInfoBox}>
//                   <Text style={styles.bankInfoTitle}>NexRide Bank Account:</Text>
//                   <Text style={styles.bankInfoLine}>Account Title: NexRide Pvt Ltd</Text>
//                   <Text style={styles.bankInfoLine}>Account No: 0123-1234567890</Text>
//                   <Text style={styles.bankInfoLine}>Bank: HBL • IBAN: PK36HABB0000001234567890</Text>
//                 </View>
//               )}

//               <Text style={styles.fieldLabel}>Your Account Title *</Text>
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.inputIcon}>👤</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Account holder name"
//                   placeholderTextColor={COLORS.textMuted}
//                   value={accountTitle}
//                   onChangeText={(val) => setAccountTitle(val.replace(/[^a-zA-Z\s]/g, ''))}
//                   maxLength={50}
//                 />
//               </View>

//               <Text style={styles.fieldLabel}>Your Account / IBAN Number *</Text>
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.inputIcon}>🏦</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Account or IBAN number"
//                   placeholderTextColor={COLORS.textMuted}
//                   value={accountNumber}
//                   onChangeText={(val) => setAccountNumber(val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24))}
//                   maxLength={24}
//                 />
//               </View>

//               <Text style={styles.fieldLabel}>Bank Name *</Text>
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.inputIcon}>🏛️</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="e.g. HBL, MCB, Allied Bank"
//                   placeholderTextColor={COLORS.textMuted}
//                   value={bankName}
//                   onChangeText={setBankName}
//                   maxLength={30}
//                 />
//               </View>

//               <View style={styles.infoBox}>
//                 <Text style={styles.infoTxt}>
//                   ℹ️ Transfer Rs. {total_amount} from the account above. OTP will verify your identity.
//                 </Text>
//               </View>
//             </View>
//           )}

//           <TouchableOpacity
//             style={styles.proceedBtn}
//             onPress={handleProceed}
//           >
//             <Text style={styles.proceedBtnTxt}>Get OTP & Verify →</Text>
//           </TouchableOpacity>

//           <View style={{ height: 30 }} />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     );
//   }

//   // ═══════════════════════════════════
//   // STEP 3 — OTP Verification
//   // ═══════════════════════════════════
//   if (step === 'otp') {
//     return (
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <View style={styles.circle1} />
//         <ScrollView
//           contentContainerStyle={[styles.scrollContent, { alignItems: 'center', paddingTop: 60 }]}
//           keyboardShouldPersistTaps="handled"
//         >
//           <TouchableOpacity style={[styles.backBtn, { alignSelf: 'flex-start' }]} onPress={() => setStep('form')}>
//             <Text style={styles.backBtnTxt}>← Back</Text>
//           </TouchableOpacity>

//           <View style={styles.otpContainer}>
//             {/* Shield Icon */}
//             <View style={styles.otpShield}>
//               <Text style={styles.otpShieldIcon}>🔐</Text>
//             </View>
//             <Text style={styles.otpTitle}>Verify Payment</Text>
            
//             <Text style={styles.otpSubtitle}>
//               Enter the 6-digit OTP sent to your{'\n'}
//               {gateway?.fields === 'mobile' ? mobileNumber : 
//                gateway?.fields === 'card'   ? `card ending in ${cardNumber.replace(/\s/g,'').slice(-4)}` : 
//                accountNumber.slice(-4) + '...'}
//             </Text>

//             {/* Amount reminder */}
//             <View style={styles.otpAmountBox}>
//               <Text style={styles.otpAmountLabel}>Paying via {gateway?.label}</Text>
//               <Text style={styles.otpAmount}>Rs. {total_amount}</Text>
//             </View>

//             {/* OTP Input */}
//             <View style={styles.otpInputWrapper}>
//               <TextInput
//                 style={styles.otpInput}
//                 placeholder="------"
//                 placeholderTextColor={COLORS.textMuted}
//                 value={otp}
//                 onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
//                 keyboardType="numeric"
//                 maxLength={6}
//                 textAlign="center"
//               />
//             </View>
//             <Text style={styles.otpHint}>
//               OTP expires in 3 minutes
//             </Text>

//             {/* Resend */}
//             <TouchableOpacity
//               style={styles.resendBtn}
//               onPress={() => {
//                 const newOtp = String(Math.floor(100000 + Math.random() * 900000));
//                 setGeneratedOtp(newOtp);
//                 Alert.alert('🔁 OTP Resent', `Your new OTP: ${newOtp}`);
//               }}
//             >
//               <Text style={styles.resendTxt}>Resend OTP</Text>
//             </TouchableOpacity>

//             {/* Pay Button */}
//             <TouchableOpacity
//               style={[styles.payNowBtn, (loading || otp.length < 6) && { opacity: 0.6 }]}
//               onPress={handleVerifyAndPay}
//               disabled={loading || otp.length < 6}
//             >
//               {loading
//                 ? <ActivityIndicator color={COLORS.white} />
//                 : <Text style={styles.payNowBtnTxt}>✅ Confirm & Pay Rs. {total_amount}</Text>
//               }
//             </TouchableOpacity>
//           </View>

//           <View style={{ height: 40 }} />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     );
//   }

//   return null;
// }

// const styles = StyleSheet.create({
//   container:     { flex: 1, backgroundColor: COLORS.navy },
//   circle1:       { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(46,134,222,0.1)', top: -80, right: -80 },
//   scrollContent: { padding: 16, paddingTop: 20 },
  
//   // Amount Card
//   amountCard:    { backgroundColor: COLORS.accent, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16 },
//   amountLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
//   amountValue:   { color: COLORS.white, fontSize: 32, fontWeight: '900', marginBottom: 6 },
//   receiptNo:     { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  
//   // Fare Card
//   fareCard:      { backgroundColor: COLORS.glass, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
//   fareTitle:     { color: COLORS.green, fontSize: 13, fontWeight: '800', marginBottom: 10 },
//   fareRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
//   fareLabel:     { color: COLORS.textMuted, fontSize: 12 },
//   fareVal:       { color: COLORS.white, fontSize: 12, fontWeight: '600' },
//   fareDivider:   { borderTopWidth: 1, borderTopColor: COLORS.glassBorder, marginVertical: 8 },
  
//   // Gateways
//   sectionTitle:  { color: COLORS.white, fontSize: 16, fontWeight: '800', marginBottom: 12 },
//   gatewaysGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
//   gatewayCard:   { width: (width - 52) / 3, backgroundColor: COLORS.glass, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, position: 'relative' },
//   gatewayCardActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(46,134,222,0.15)' },
//   gatewayIcon:   { fontSize: 26, marginBottom: 6 },
//   gatewayLabel:  { color: COLORS.white, fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 3 },
//   gatewayFee:    { color: COLORS.textMuted, fontSize: 9 },
//   selectedCheck: { position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.green, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
//   selectedCheckTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  
//   // Buttons
//   proceedBtn:    { backgroundColor: COLORS.accent, padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
//   proceedBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
//   laterBtn:      { backgroundColor: COLORS.glass, padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
//   laterBtnTxt:   { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  
//   // Back button
//   backBtn:       { backgroundColor: COLORS.glass, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.glassBorder, alignSelf: 'flex-start', marginBottom: 16 },
//   backBtnTxt:    { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  
//   // Gateway Header
//   gatewayHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.glass, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1.5 },
//   gatewayHeaderIcon:  { fontSize: 32 },
//   gatewayHeaderLabel: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
//   gatewayHeaderFee:   { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
//   gatewayHeaderAmount:{ marginLeft: 'auto', alignItems: 'flex-end' },
//   gatewayHeaderAmountLabel: { color: COLORS.textMuted, fontSize: 11 },
//   gatewayHeaderAmountVal:   { fontSize: 18, fontWeight: '800' },
  
//   // Form Card
//   formCard:      { backgroundColor: COLORS.glass, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
//   formTitle:     { color: COLORS.white, fontSize: 15, fontWeight: '800', marginBottom: 16 },
//   fieldLabel:    { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
//   inputWrapper:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 12, marginBottom: 14, minHeight: 50 },
//   inputPrefix:   { color: COLORS.textMuted, fontSize: 13, marginRight: 8, fontWeight: '600' },
//   inputIcon:     { fontSize: 15, marginRight: 8 },
//   input:         { flex: 1, color: COLORS.white, fontSize: 14, paddingVertical: 12 },
//   rowFields:     { flexDirection: 'row' },
//   infoBox:       { backgroundColor: 'rgba(46,134,222,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(46,134,222,0.2)' },
//   infoTxt:       { color: COLORS.light, fontSize: 12, lineHeight: 18 },
  
//   // Card Preview
//   cardPreview:   { borderRadius: 16, padding: 20, marginBottom: 16, minHeight: 100 },
//   cardPreviewChip:    { color: 'rgba(255,255,255,0.9)', fontSize: 16, letterSpacing: 2, fontWeight: '700', marginBottom: 16 },
//   cardPreviewHolder:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 8 },
//   cardPreviewBottom:  { flexDirection: 'row', justifyContent: 'space-between' },
//   cardPreviewExpiry:  { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
//   cardPreviewNetwork: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '800' },
  
//   // Bank Info
//   bankInfoBox:   { backgroundColor: 'rgba(38,208,124,0.1)', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(38,208,124,0.2)' },
//   bankInfoTitle: { color: COLORS.green, fontSize: 13, fontWeight: '800', marginBottom: 6 },
//   bankInfoLine:  { color: COLORS.white, fontSize: 12, marginBottom: 3 },
  
//   // OTP
//   otpContainer:  { width: '100%', alignItems: 'center' },
//   otpShield:     { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(46,134,222,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: COLORS.accent },
//   otpShieldIcon: { fontSize: 36 },
//   otpTitle:      { color: COLORS.white, fontSize: 24, fontWeight: '900', marginBottom: 8 },
//   otpSubtitle:   { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
//   otpAmountBox:  { backgroundColor: COLORS.glass, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.glassBorder, width: '100%' },
//   otpAmountLabel:{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
//   otpAmount:     { color: COLORS.green, fontSize: 24, fontWeight: '900' },
//   otpInputWrapper:{ width: '100%', marginBottom: 10 },
//   otpInput:      { backgroundColor: COLORS.inputBg, borderRadius: 16, borderWidth: 2, borderColor: COLORS.accent, color: COLORS.white, fontSize: 28, fontWeight: '800', padding: 16, letterSpacing: 12 },
//   otpHint:       { color: COLORS.textMuted, fontSize: 12, marginBottom: 16 },
//   resendBtn:     { marginBottom: 24 },
//   resendTxt:     { color: COLORS.light, fontSize: 14, fontWeight: '700' },
//   payNowBtn:     { backgroundColor: COLORS.green, padding: 18, borderRadius: 16, alignItems: 'center', width: '100%' },
//   payNowBtnTxt:  { color: COLORS.white, fontSize: 16, fontWeight: '800' },
// });
