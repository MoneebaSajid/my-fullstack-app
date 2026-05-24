import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Dimensions
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

const COLORS = {
  navy: '#0A1628',
  accent: '#2E86DE',
  light: '#4FC3F7',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  textMuted: 'rgba(255,255,255,0.55)',
  green: '#26D07C',
};

export default function NearestDriversScreen({ navigation }) {
  const [myLocation, setMyLocation] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    getLocationAndDrivers();
    // Refresh every 15 seconds
    intervalRef.current = setInterval(fetchNearestDrivers, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getLocationAndDrivers = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission needed!');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      setMyLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      await fetchNearestDrivers(
        location.coords.latitude,
        location.coords.longitude
      );

    } catch (error) {
      Alert.alert('Error', 'Could not get location!');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearestDrivers = async (lat, lng) => {
    try {
      const useLat = lat || myLocation?.latitude;
      const useLng = lng || myLocation?.longitude;

      if (!useLat || !useLng) return;

      const res = await api.get(
        `/tracking/nearest?latitude=${useLat}&longitude=${useLng}&radius=20`
      );
      setDrivers(res.data.drivers || []);

    } catch (error) {
      console.log('Fetch nearest drivers error:', error);
    }
  };

  const focusDriver = (driver) => {
    setSelectedDriver(driver);
    if (mapRef.current && driver.current_latitude) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(driver.current_latitude),
        longitude: parseFloat(driver.current_longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const getDistanceLabel = (km) => {
    if (!km) return 'N/A';
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingTxt}>Finding nearest drivers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: myLocation?.latitude || 31.5204,
          longitude: myLocation?.longitude || 74.3587,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* My Location Circle */}
        {myLocation && (
          <Circle
            center={myLocation}
            radius={2000}
            fillColor="rgba(46,134,222,0.1)"
            strokeColor="rgba(46,134,222,0.3)"
            strokeWidth={1}
          />
        )}

        {/* Driver Markers */}
        {drivers.map((driver) => (
          driver.current_latitude && driver.current_longitude && (
            <Marker
              key={driver.driver_id}
              coordinate={{
                latitude: parseFloat(driver.current_latitude),
                longitude: parseFloat(driver.current_longitude),
              }}
              title={`🚗 ${driver.name}`}
              description={`${driver.model || 'Vehicle'} • ${getDistanceLabel(driver.distance_km)} • ⭐ ${driver.rating || 'N/A'}`}
              onPress={() => setSelectedDriver(driver)}
            >
              <View style={[
                styles.driverMarker,
                selectedDriver?.driver_id === driver.driver_id && styles.driverMarkerSelected
              ]}>
                <Text style={styles.driverMarkerIcon}>🚗</Text>
                <Text style={styles.driverMarkerName}>
                  {driver.name?.split(' ')[0]}
                </Text>
              </View>
            </Marker>
          )
        ))}
      </MapView>

      {/* Header Overlay */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>🗺️ Live Driver Tracking</Text>
          <Text style={styles.headerSubtitle}>
            {drivers.length} drivers nearby • Updates every 15s
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => fetchNearestDrivers()}
        >
          <Text style={styles.refreshTxt}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Driver Cards */}
      <View style={styles.driversPanel}>
        <Text style={styles.panelTitle}>
          Nearest Available Drivers ({drivers.length})
        </Text>

        {drivers.length === 0 ? (
          <View style={styles.noDrivers}>
            <Text style={styles.noDriversTxt}>
              No drivers available nearby. Try increasing search radius.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
          >
            {drivers.map((driver) => (
              <TouchableOpacity
                key={driver.driver_id}
                style={[
                  styles.driverCard,
                  selectedDriver?.driver_id === driver.driver_id && styles.driverCardSelected
                ]}
                onPress={() => focusDriver(driver)}
                activeOpacity={0.85}
              >
                {/* Avatar */}
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverAvatarTxt}>
                    {driver.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverVehicle}>
                  🚗 {driver.model || 'Vehicle'}
                </Text>
                <Text style={styles.driverRating}>
                  ⭐ {driver.rating || 'N/A'}
                </Text>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceTxt}>
                    📍 {getDistanceLabel(driver.distance_km)}
                  </Text>
                </View>

                {driver.fare_per_hour && (
                  <Text style={styles.driverFare}>
                    Rs. {driver.fare_per_hour}/hr
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.bookDriverBtn}
                  onPress={() => navigation.navigate('PassengerHome')}
                >
                  <Text style={styles.bookDriverTxt}>Book →</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingTxt: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 10,
  },
  map: {
    width: width,
    height: height * 0.58,
  },
  driverMarker: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  driverMarkerSelected: {
    backgroundColor: COLORS.green,
    transform: [{ scale: 1.15 }],
  },
  driverMarkerIcon: {
    fontSize: 18,
  },
  driverMarkerName: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,22,40,0.85)',
    gap: 10,
  },
  backBtn: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backBtnTxt: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: COLORS.accent,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshTxt: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  driversPanel: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  panelTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  noDrivers: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDriversTxt: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  driverCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 14,
    marginRight: 12,
    width: 150,
    alignItems: 'center',
  },
  driverCardSelected: {
    borderColor: COLORS.green,
    backgroundColor: 'rgba(38,208,124,0.1)',
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  driverAvatarTxt: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  driverName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  driverVehicle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 3,
    textAlign: 'center',
  },
  driverRating: {
    color: '#FFD700',
    fontSize: 12,
    marginBottom: 6,
  },
  distanceBadge: {
    backgroundColor: 'rgba(46,134,222,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  distanceTxt: {
    color: COLORS.light,
    fontSize: 10,
    fontWeight: '600',
  },
  driverFare: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  bookDriverBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    width: '100%',
    alignItems: 'center',
  },
  bookDriverTxt: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});