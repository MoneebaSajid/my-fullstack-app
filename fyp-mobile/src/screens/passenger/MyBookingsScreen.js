import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
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
  warning: '#FFC107',
  danger: '#FF4D4D',
  orange: '#FF9500', // Added orange for Pay Now button
};

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState({
    with_driver: [],
    without_driver: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('with_driver');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings({
        with_driver: response.data.bookings_with_driver,
        without_driver: response.data.bookings_without_driver
      });
    } catch (error) {
      Alert.alert('Error', 'Could not load bookings!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return COLORS.green;
      case 'pending': return COLORS.warning;
      case 'cancelled': return COLORS.danger;
      case 'completed': return COLORS.light;
      default: return COLORS.textMuted;
    }
  };

  const renderBookingWithDriver = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.vehicleName}>🚗 {item.model}</Text>
        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusTxt, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>👨‍✈️ Driver</Text>
        <Text style={styles.infoValue}>{item.driver_name}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>📍 Pickup</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{item.pickup_location}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>🏁 Dropoff</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{item.dropoff_location}</Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateTxt}>📅 {new Date(item.start_time).toLocaleDateString()}</Text>
        <Text style={styles.dateArrow}> → </Text>
        <Text style={styles.dateTxt}>{new Date(item.end_time).toLocaleDateString()}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.amountLabel}>Total Fare</Text>
          <Text style={styles.amount}>Rs. {item.total_amount}</Text>
        </View>

        {/* Conditional Buttons based on status */}
        {item.status === 'pending' || item.status === 'confirmed' ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.orange }]}
            onPress={() => navigation.navigate('Payment', {
              booking_id: item.booking_id,
              booking_type: 'with-driver',
              total_amount: item.total_amount,
              receipt_number: item.receipt_number || `NXR-PL-${item.booking_id}`, // Fallback receipt number for pay later
              fare_details: item.fare_details || { base_fare: item.total_amount } // Fallback fare details
            })}
          >
            <Text style={styles.actionTxt}>💳 Pay Now</Text>
          </TouchableOpacity>
        ) : item.status === 'completed' ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Feedback', {
              booking_id: item.booking_id,
              booking_type: 'with-driver',
              driver_id: item.driver_id
            })}
          >
            <Text style={styles.actionTxt}>⭐ Feedback</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Track Driver Button — only for active bookings */}
      {(item.status === 'confirmed' || item.status === 'started') && (
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate('TrackDriver', {
            booking: item,
            driver_id: item.driver_id,
            driver_name: item.driver_name,
          })}
        >
          <Text style={styles.trackBtnTxt}>🗺️ Track My Driver Live</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBookingWithoutDriver = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.vehicleName}>🚗 {item.model}</Text>
        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusTxt, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>📋 Registration</Text>
        <Text style={styles.infoValue}>{item.reg_number}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>📍 Pickup Loc</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{item.self_pickup_location}</Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateTxt}>📅 {new Date(item.start_date).toLocaleDateString()}</Text>
        <Text style={styles.dateArrow}> → </Text>
        <Text style={styles.dateTxt}>{new Date(item.end_date).toLocaleDateString()}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.amountLabel}>Total Fare</Text>
          <Text style={styles.amount}>Rs. {item.total_amount}</Text>
        </View>

        {/* Conditional Buttons based on status */}
        {item.status === 'pending' || item.status === 'confirmed' ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.orange }]}
            onPress={() => navigation.navigate('Payment', {
              booking_id: item.booking_id,
              booking_type: 'without-driver',
              total_amount: item.total_amount,
              receipt_number: item.receipt_number || `NXR-PL-${item.booking_id}`,
              fare_details: item.fare_details || { base_fare: item.total_amount }
            })}
          >
            <Text style={styles.actionTxt}>💳 Pay Now</Text>
          </TouchableOpacity>
        ) : item.status === 'completed' ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Feedback', {
              booking_id: item.booking_id,
              booking_type: 'without-driver',
              driver_id: null
            })}
          >
            <Text style={styles.actionTxt}>⭐ Feedback</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingTxt}>Loading your rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Decorative Background circles from Login theme */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.tagline}>Manage your travel history</Text>
      </View>

      {/* Modern Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'with_driver' && styles.tabActive]}
          onPress={() => setActiveTab('with_driver')}
        >
          <Text style={[styles.tabTxt, activeTab === 'with_driver' && styles.tabTxtActive]}>
            Chauffeur ({bookings.with_driver.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'without_driver' && styles.tabActive]}
          onPress={() => setActiveTab('without_driver')}
        >
          <Text style={[styles.tabTxt, activeTab === 'without_driver' && styles.tabTxtActive]}>
            Self Drive ({bookings.without_driver.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'with_driver' ? bookings.with_driver : bookings.without_driver}
        renderItem={activeTab === 'with_driver' ? renderBookingWithDriver : renderBookingWithoutDriver}
        keyExtractor={(item) => item.booking_id.toString()}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTxt}>No bookings found in this category.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingTxt: {
    color: COLORS.textMuted,
    marginTop: 10,
  },
  circle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(46,134,222,0.1)',
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(79,195,247,0.05)',
    bottom: 50,
    left: -40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    marginHorizontal: 24,
    borderRadius: 14,
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.accent,
  },
  tabTxt: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  trackBtn: {
    backgroundColor: 'rgba(46,134,222,0.15)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  trackBtnTxt: {
    color: COLORS.light,
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabTxtActive: {
    color: COLORS.white,
  },
  listPadding: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusTxt: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '500',
    maxWidth: '60%',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    justifyContent: 'center',
  },
  dateTxt: {
    color: COLORS.light,
    fontSize: 12,
    fontWeight: '600',
  },
  dateArrow: {
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.green,
  },
  actionBtn: { // Renamed from feedbackBtn for better reuse
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionTxt: { // Renamed from feedbackTxt for better reuse
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyTxt: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});