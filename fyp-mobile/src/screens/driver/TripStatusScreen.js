import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Dimensions
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
  cardBg: 'rgba(255,255,255,0.06)',
  textMuted: 'rgba(255,255,255,0.55)',
  success: '#00E676',
  successBg: 'rgba(0,230,118,0.12)',
  warning: '#FFD600',
  warningBg: 'rgba(255,214,0,0.12)',
  orange: '#FF9500',
  orangeBg: 'rgba(255,149,0,0.12)',
};

export default function TripStatusScreen({ route, navigation }) {
  const { booking } = route.params;
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(booking.status);

  const statusFlow = [
    { key: 'pending', label: '⏳ Pending', color: COLORS.warning },
    { key: 'confirmed', label: '✅ Confirmed', color: COLORS.accent },
    { key: 'started', label: '🚗 Trip Started', color: COLORS.orange },
    { key: 'completed', label: '🏁 Completed', color: COLORS.success },
  ];

  const getNextStatus = () => {
    if (currentStatus === 'pending') return 'confirmed';
    if (currentStatus === 'confirmed') return 'started';
    if (currentStatus === 'started') return 'completed';
    return null;
  };

  const getNextLabel = () => {
    if (currentStatus === 'pending') return '✅ Confirm Trip';
    if (currentStatus === 'confirmed') return '🚗 Start Trip';
    if (currentStatus === 'started') return '🏁 Complete Trip';
    return null;
  };

  const handleUpdateStatus = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return;

    setLoading(true);
    try {
      await api.put(`/bookings/update-status/${booking.booking_id}`, {
        status: nextStatus,
        booking_type: 'with-driver'
      });

      setCurrentStatus(nextStatus);

      Alert.alert(
        '✅ Status Updated!',
        `Trip status changed to: ${nextStatus.toUpperCase()}`,
        nextStatus === 'completed'
          ? [{ text: 'OK', onPress: () => navigation.navigate('DriverHome') }]
          : [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert('Error',
        error.response?.data?.message ||
        error.message ||
        'Could not update status!'
      );
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStatusColor = () => {
    const status = statusFlow.find(s => s.key === currentStatus);
    return status ? status.color : COLORS.textMuted;
  };

  return (
    <View style={styles.container}>
      {/* Background circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Booking Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📋</Text>
            <Text style={styles.sectionTitle}>Booking Details</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoIcon}>👤</Text>
              <Text style={styles.label}>Passenger</Text>
            </View>
            <Text style={styles.value}>{booking.passenger_name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoIcon}>🚗</Text>
              <Text style={styles.label}>Vehicle</Text>
            </View>
            <Text style={styles.value}>{booking.model}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.label}>Pickup</Text>
            </View>
            <Text style={styles.value}>{booking.pickup_location}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoIcon}>🏁</Text>
              <Text style={styles.label}>Dropoff</Text>
            </View>
            <Text style={styles.value}>{booking.dropoff_location}</Text>
          </View>
          
          <View style={[styles.infoRow, styles.amountRow]}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoIcon}>💰</Text>
              <Text style={styles.label}>Amount</Text>
            </View>
            <View style={styles.amountBadge}>
              <Text style={styles.amountValue}>Rs. {booking.total_amount}</Text>
            </View>
          </View>
        </View>

        {/* Status Flow */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🚦</Text>
            <Text style={styles.sectionTitle}>Trip Progress</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statusFlow}>
            {statusFlow.map((status, index) => {
              const isActive = currentStatus === status.key;
              const isPassed = statusFlow.findIndex(s => s.key === currentStatus) >= index;
              
              return (
                <View key={status.key} style={styles.statusStep}>
                  <View style={[
                    styles.statusDot,
                    { 
                      backgroundColor: isPassed ? status.color : COLORS.cardBg,
                      borderColor: isPassed ? status.color : COLORS.glassBorder,
                    }
                  ]}>
                    <Text style={[
                      styles.statusDotTxt,
                      !isPassed && { color: COLORS.textMuted }
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  {index < statusFlow.length - 1 && (
                    <View style={[
                      styles.statusLine,
                      { backgroundColor: statusFlow.findIndex(s => s.key === currentStatus) > index ? COLORS.success : COLORS.glassBorder }
                    ]} />
                  )}
                  <Text style={[
                    styles.statusLabel,
                    isActive && { color: status.color, fontWeight: '700' }
                  ]}>
                    {status.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Current Status */}
        <View style={[styles.statusCard, { borderLeftColor: getCurrentStatusColor() }]}>
          <Text style={styles.currentStatusLabel}>Current Status</Text>
          <Text style={[styles.currentStatusTxt, { color: getCurrentStatusColor() }]}>
            {statusFlow.find(s => s.key === currentStatus)?.label || currentStatus}
          </Text>
        </View>

        {/* Action Button */}
        {getNextStatus() && (
          <TouchableOpacity
            style={[
              styles.actionBtn, 
              { 
                backgroundColor: getCurrentStatusColor(),
                opacity: loading ? 0.7 : 1 
              }
            ]}
            onPress={handleUpdateStatus}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionTxt}>{getNextLabel()}</Text>
            )}
          </TouchableOpacity>
        )}

        {currentStatus === 'completed' && (
          <View style={styles.completedCard}>
            <Text style={styles.completedIcon}>🎉</Text>
            <Text style={styles.completedTxt}>Trip Completed!</Text>
            <View style={styles.completedBadge}>
              <Text style={styles.completedSubTxt}>
                Earnings: Rs. {booking.total_amount}
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(46,134,222,0.12)',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(79,195,247,0.08)',
    bottom: 100,
    left: -60,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(26,60,110,0.6)',
    top: height * 0.4,
    right: -40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  infoIcon: {
    fontSize: 16,
    width: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  amountRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  amountBadge: {
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.2)',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.3,
  },
  statusFlow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statusStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  statusDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  statusDotTxt: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  statusLine: {
    position: 'absolute',
    top: 20,
    left: '60%',
    right: '-60%',
    height: 3,
    zIndex: -1,
    borderRadius: 2,
  },
  statusLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  statusCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderLeftWidth: 5,
  },
  currentStatusLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentStatusTxt: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionBtn: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionTxt: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  completedCard: {
    backgroundColor: COLORS.successBg,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.3)',
  },
  completedIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  completedTxt: {
    color: COLORS.success,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  completedSubTxt: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});