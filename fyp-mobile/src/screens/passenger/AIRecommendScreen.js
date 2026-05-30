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
  accentBg: 'rgba(46,134,222,0.12)',
};

export default function AIRecommendScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [searched, setSearched] = useState(false);

  const [form, setForm] = useState({
    trip_type: 'family',
    budget_per_day: 15000,
    passengers: 4,
    need_driver: true,
  });

  const tripTypes = [
    { key: 'family', label: '👨‍👩‍👧‍👦 Family Trip', desc: 'SUVs & Vans' },
    { key: 'business', label: '💼 Business', desc: 'Luxury Sedans' },
    { key: 'economy', label: '💰 Economy', desc: 'Hatchbacks & Compacts' },
    { key: 'wedding', label: '💒 Wedding', desc: 'Premium & Convertibles' },
  ];

  const budgets = [
    { value: 8000, label: 'Rs. 8,000' },
    { value: 12000, label: 'Rs. 12,000' },
    { value: 15000, label: 'Rs. 15,000' },
    { value: 20000, label: 'Rs. 20,000' },
    { value: 30000, label: 'Rs. 30,000' },
  ];

  const passengerOptions = [1, 2, 4, 6, 8];

  const handleRecommend = async () => {
    setLoading(true);
    setSearched(false);
    try {
      const response = await api.post('/ai/recommend', form);
      setRecommendations(response.data.top_recommendations);
      setSearched(true);
    } catch (error) {
      Alert.alert('Error', 'Could not get recommendations!');
    } finally {
      setLoading(false);
    }
  };

  const renderVehicleCard = (item, index) => (
    <View key={item.vehicle_id} style={styles.vehicleCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankTxt}>#{index + 1}</Text>
      </View>
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleIcon}>🚗</Text>
          <Text style={styles.vehicleModel}>{item.model}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.vehicleType}>{item.type_name}</Text>
        </View>
        <View style={styles.vehicleDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🎨</Text>
            <Text style={styles.detail}>{item.color}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detail}>{item.year}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📋</Text>
            <Text style={styles.detail}>{item.reg_number}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceIcon}>💰</Text>
            <Text style={styles.price}>Rs. {item.fare_per_day}/day</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceIcon}>⏱️</Text>
            <Text style={styles.price}>Rs. {item.fare_per_hour}/hr</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
        activeOpacity={0.85}
      >
        <Text style={styles.bookTxt}>Book This Vehicle </Text>
      </TouchableOpacity>
    </View>
  );

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

        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerIcon}>🤖</Text>
          <Text style={styles.headerTitle}>AI Vehicle Recommendation</Text>
          <Text style={styles.headerSubtitle}>
            Tell us about your trip and our AI will find the best vehicle for you!
          </Text>
        </View>

        {/* Trip Type */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionIcon}>🚦</Text>
            <Text style={styles.sectionTitle}>Select Trip Type</Text>
          </View>
          <View style={styles.grid}>
            {tripTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.tripBtn,
                  form.trip_type === type.key && styles.tripBtnActive
                ]}
                onPress={() => setForm({ ...form, trip_type: type.key })}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tripLabel,
                  form.trip_type === type.key && styles.tripLabelActive
                ]}>
                  {type.label}
                </Text>
                <Text style={[
                  styles.tripDesc,
                  form.trip_type === type.key && styles.tripDescActive
                ]}>
                  {type.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionIcon}>💰</Text>
            <Text style={styles.sectionTitle}>Daily Budget</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetScroll}
          >
            {budgets.map((b) => (
              <TouchableOpacity
                key={b.value}
                style={[
                  styles.budgetBtn,
                  form.budget_per_day === b.value && styles.budgetBtnActive
                ]}
                onPress={() => setForm({ ...form, budget_per_day: b.value })}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.budgetTxt,
                  form.budget_per_day === b.value && styles.budgetTxtActive
                ]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedInfo}>
              Selected: Rs. {form.budget_per_day.toLocaleString()} per day
            </Text>
          </View>
        </View>

        {/* Passengers */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionIcon}>👥</Text>
            <Text style={styles.sectionTitle}>Number of Passengers</Text>
          </View>
          <View style={styles.passRow}>
            {passengerOptions.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.passBtn,
                  form.passengers === p && styles.passBtnActive
                ]}
                onPress={() => setForm({ ...form, passengers: p })}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.passTxt,
                  form.passengers === p && styles.passTxtActive
                ]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Need Driver */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionIcon}>👨‍✈️</Text>
            <Text style={styles.sectionTitle}>Do You Need a Driver?</Text>
          </View>
          <View style={styles.driverRow}>
            <TouchableOpacity
              style={[styles.driverBtn, form.need_driver && styles.driverBtnActive]}
              onPress={() => setForm({ ...form, need_driver: true })}
              activeOpacity={0.8}
            >
              <Text style={styles.driverIcon}>✅</Text>
              <Text style={[styles.driverTxt, form.need_driver && styles.driverTxtActive]}>
                Yes, With Driver
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.driverBtn, !form.need_driver && styles.driverBtnActive]}
              onPress={() => setForm({ ...form, need_driver: false })}
              activeOpacity={0.8}
            >
              <Text style={styles.driverIcon}>🚗</Text>
              <Text style={[styles.driverTxt, !form.need_driver && styles.driverTxtActive]}>
                Self Drive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Get Recommendation Button */}
        <TouchableOpacity
          style={[styles.recommendBtn, loading && { opacity: 0.7 }]}
          onPress={handleRecommend}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.recommendIcon}>🤖</Text>
              <Text style={styles.recommendTxt}>Get AI Recommendation</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {searched && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsIcon}>
                {recommendations.length > 0 ? '✅' : '❌'}
              </Text>
              <Text style={styles.resultsTitle}>
                {recommendations.length > 0
                  ? `Top ${recommendations.length} Recommendations for You`
                  : 'No vehicles found matching your criteria!'}
              </Text>
            </View>
            {recommendations.map((item, index) => renderVehicleCard(item, index))}
          </View>
        )}

        <View style={{ height: 30 }} />

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
    top: height * 0.5,
    right: -40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  headerCard: {
    backgroundColor: COLORS.accentBg,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    padding: 18,
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
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tripBtn: {
    width: '47%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
  },
  tripBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentBg,
  },
  tripLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  tripLabelActive: {
    color: COLORS.white,
  },
  tripDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  tripDescActive: {
    color: COLORS.light,
  },
  budgetScroll: {
    paddingRight: 16,
  },
  budgetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 10,
    backgroundColor: COLORS.cardBg,
  },
  budgetBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  budgetTxt: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  budgetTxtActive: {
    color: COLORS.white,
  },
  selectedBadge: {
    marginTop: 14,
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.2)',
  },
  selectedInfo: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '700',
  },
  passRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  passBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
  },
  passBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  passTxt: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  passTxtActive: {
    color: COLORS.white,
  },
  driverRow: {
    flexDirection: 'row',
    gap: 10,
  },
  driverBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    gap: 6,
  },
  driverBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentBg,
  },
  driverIcon: {
    fontSize: 20,
  },
  driverTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  driverTxtActive: {
    color: COLORS.white,
  },
  recommendBtn: {
    backgroundColor: COLORS.accent,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recommendIcon: {
    fontSize: 24,
  },
  recommendTxt: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultsSection: {
    marginBottom: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  resultsIcon: {
    fontSize: 24,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  rankBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 1,
  },
  rankTxt: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  vehicleInfo: {
    marginBottom: 14,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingRight: 40,
  },
  vehicleIcon: {
    fontSize: 22,
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: COLORS.accentBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  vehicleType: {
    fontSize: 12,
    color: COLORS.light,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vehicleDetails: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {
    fontSize: 14,
  },
  detail: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.2)',
  },
  priceIcon: {
    fontSize: 14,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  bookBtn: {
    backgroundColor: COLORS.success,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookTxt: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});