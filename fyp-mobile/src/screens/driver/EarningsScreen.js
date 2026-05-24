import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
  Animated, Dimensions
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
};

export default function EarningsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [completedTrips, setCompletedTrips] = useState(0);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/bookings/driver/my-bookings');
      const allBookings = response.data.bookings;

      // Filter completed bookings
      const completed = allBookings.filter(b => b.status === 'completed');
      setBookings(completed);
      setCompletedTrips(completed.length);

      // Calculate total earnings
      const total = completed.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
      setTotalEarnings(total);

    } catch (error) {
      Alert.alert('Error', 'Could not load earnings!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const renderEarning = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.vehicleRow}>
          <Text style={styles.vehicleIcon}>🚗</Text>
          <Text style={styles.vehicleName}>{item.model}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amount}>Rs. {item.total_amount}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>👤</Text>
        <Text style={styles.infoText}>{item.passenger_name}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📍</Text>
        <Text style={styles.infoText}>{item.pickup_location}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>🏁</Text>
        <Text style={styles.infoText}>{item.dropoff_location}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📅</Text>
        <Text style={styles.infoText}>
          {new Date(item.start_time).toLocaleDateString('en-PK')}
        </Text>
      </View>
      
      <View style={styles.completedBadge}>
        <Text style={styles.completedIcon}>✅</Text>
        <Text style={styles.completedTxt}>Completed</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
          <Text style={styles.summaryIcon}>💰</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryValue}>
            Rs. {totalEarnings.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardSecondary]}>
          <Text style={styles.summaryIcon}>🚀</Text>
          <Text style={styles.summaryLabel}>Trips Done</Text>
          <Text style={styles.summaryValue}>{completedTrips}</Text>
        </View>
      </View>

      {/* Avg per trip */}
      <View style={styles.avgCard}>
        <View style={styles.avgLeft}>
          <Text style={styles.avgIcon}>📊</Text>
          <Text style={styles.avgLabel}>Average Per Trip</Text>
        </View>
        <Text style={styles.avgValue}>
          Rs. {completedTrips > 0
            ? Math.round(totalEarnings / completedTrips).toLocaleString()
            : 0}
        </Text>
      </View>

      {/* Earnings List */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          Completed Trips
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{completedTrips}</Text>
        </View>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderEarning}
        keyExtractor={(item) => item.booking_id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No completed trips yet!</Text>
            <Text style={styles.emptySubtext}>Your earnings will appear here</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingTop: 20,
    paddingHorizontal: 16,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  summaryCardPrimary: {
    backgroundColor: COLORS.glass,
  },
  summaryCardSecondary: {
    backgroundColor: COLORS.cardBg,
  },
  summaryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avgCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avgLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avgIcon: {
    fontSize: 20,
  },
  avgLabel: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '700',
  },
  avgValue: {
    fontSize: 20,
    color: COLORS.success,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleIcon: {
    fontSize: 20,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  amountBadge: {
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.2)',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  infoIcon: {
    fontSize: 14,
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  completedBadge: {
    backgroundColor: COLORS.successBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.2)',
  },
  completedIcon: {
    fontSize: 14,
  },
  completedTxt: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});