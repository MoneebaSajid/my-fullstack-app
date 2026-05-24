import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, StatusBar, Dimensions
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
  green: '#28a745', // Kept as requested
};

export default function VehicleDetailScreen({ route, navigation }) {
  const { vehicle } = route.params;
  const [bookingType, setBookingType] = useState('with-driver');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      
      {/* Background Decor */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vehicle Details</Text>
          <Text style={styles.tagline}>Premium selection for your journey</Text>
        </View>

        {/* Vehicle Info Card */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.model}>🚗 {vehicle.model}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeTxt}>{vehicle.type_name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Registration</Text>
              <Text style={styles.specValue}>{vehicle.reg_number}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Color</Text>
              <Text style={styles.specValue}>{vehicle.color}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Year</Text>
              <Text style={styles.specValue}>{vehicle.year}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Status</Text>
              <Text style={[styles.specValue, { color: COLORS.green }]}>{vehicle.availability}</Text>
            </View>
          </View>
        </View>

        {/* Pricing Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💰 Pricing Plans</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Per Hour</Text>
            <Text style={styles.priceValue}>Rs. {vehicle.fare_per_hour}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Per KM</Text>
            <Text style={styles.priceValue}>Rs. {vehicle.fare_per_km}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Full Day</Text>
            <Text style={styles.priceValue}>Rs. {vehicle.fare_per_day}</Text>
          </View>
        </View>

        {/* Booking Type Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🚦 Select Booking Type</Text>
          <View style={styles.rowContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.typeBtn, bookingType === 'with-driver' && styles.typeBtnActive]}
              onPress={() => setBookingType('with-driver')}
            >
              <Text style={[styles.typeTxt, bookingType === 'with-driver' && styles.typeTxtActive]}>
                👨‍✈️ With Driver
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.typeBtn, bookingType === 'without-driver' && styles.typeBtnActive]}
              onPress={() => setBookingType('without-driver')}
            >
              <Text style={[styles.typeTxt, bookingType === 'without-driver' && styles.typeTxtActive]}>
                🚗 Self Drive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Book Now Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Booking', {
            vehicle,
            bookingType
          })}
        >
          <Text style={styles.bookTxt}>Book Now 🚀</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
    bottom: 100,
    left: -40,
  },
  header: {
    marginBottom: 25,
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
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  model: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  typeBadge: {
    backgroundColor: 'rgba(46, 134, 222, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(46, 134, 222, 0.3)',
  },
  typeTxt: {
    color: COLORS.light,
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 20,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  specItem: {
    width: '45%',
  },
  specLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.green,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
    backgroundColor: 'rgba(46, 134, 222, 0.05)',
  },
  typeBtnActive: {
    backgroundColor: COLORS.accent,
  },
  typeTxt: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  typeTxtActive: {
    color: COLORS.white,
  },
  bookBtn: {
    backgroundColor: COLORS.green,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  bookTxt: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});