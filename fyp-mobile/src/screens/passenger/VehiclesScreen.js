import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  Animated, Dimensions, TextInput, StatusBar
} from 'react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const COLORS = {
  navy: '#060B12', // Slightly deeper navy
  blue: '#1A3C6E',
  accent: '#3897FF', // Brighter, more modern blue
  light: '#70D7FF',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.1)',
  inputBg: 'rgba(255,255,255,0.07)',
  textMuted: '#8E9AAF',
  green: '#32E0C4',
  card: 'rgba(255,255,255,0.03)',
};

export default function VehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Animation Values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    const results = vehicles.filter(v =>
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.type_name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(results);
  }, [search, vehicles]);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles);
      setFiltered(response.data.vehicles);
      
      // Start Fade-in for the container
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      Alert.alert('Error', 'Could not load vehicles!');
    } finally {
      setLoading(false);
    }
  };

  const renderVehicle = ({ item, index }) => {
    // Individual Card Animation (Staggered Effect)
    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0], // Cards slide up from different positions
    });

    return (
      <Animated.View 
        style={[
          styles.cardContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY }] 
          }
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
          activeOpacity={0.9}
        >
          <View style={styles.cardTop}>
            <View style={styles.carIconBox}>
              <Text style={styles.carIcon}>🚗</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeTxt}>{item.type_name.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.model}>{item.model}</Text>
          <Text style={styles.regNum}>{item.reg_number}</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailTxt}>🎨 {item.color}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailTxt}>📅 {item.year}</Text>
            </View>
            <View style={styles.availBadge}>
              <View style={styles.availDot} />
              <Text style={styles.availTxt}>Available</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Daily Rate</Text>
              <Text style={styles.priceVal}>Rs. {item.fare_per_day}</Text>
            </View>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
            >
              <Text style={styles.bookNowTxt}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Animated Header Section */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.headerTitle}>{global.userInfo?.name?.split(' ')[0] || 'User'}</Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.iconBtnTxt}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search make or model..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.aiBtn}
          onPress={() => navigation.navigate('AIRecommend')}
        >
          <Text style={styles.aiBtnTxt}>✨ Get AI Recommendations</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.iconBtn}
  onPress={() => navigation.navigate('NearestDrivers')}
>
  <Text style={styles.iconBtnTxt}>🗺️</Text>
</TouchableOpacity>
      </Animated.View>

      <FlatList
        data={filtered}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.vehicle_id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        ListEmptyComponent={
          <Text style={styles.emptyTxt}>No luxury rides found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 25,
  },
  greeting: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 10,
  },
  aiBtn: {
    backgroundColor: 'rgba(56, 151, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 151, 255, 0.3)',
    marginBottom: 20,
  },
  aiBtnTxt: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  carIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIcon: { fontSize: 24 },
  typeBadge: {
    backgroundColor: 'rgba(56, 151, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    height: 28,
  },
  typeTxt: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  model: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  regNum: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
  },
  detailTxt: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginRight: 15,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 224, 196, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginRight: 6,
  },
  availTxt: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  priceVal: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookNowBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bookNowTxt: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyTxt: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 50,
  }
});