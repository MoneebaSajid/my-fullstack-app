import React, { useState, useEffect, useRef, useCallback } from 'react'; 
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const AVG_SPEED_KMH = 100;
const HOURS_PER_DAY = 12;
const GST_RATE = 0.05;
const ROAD_DISTANCE_FACTOR = 1.25;
const DEPOSIT_AMOUNT = 2000;
const DRIVER_FLAT_FEE = 1000;

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
  red: '#FF4757',
  orange: '#FF9500',
};

// ══════════════════════════════════════════════════════════
// LOCATION FIELD — defined OUTSIDE parent to prevent remount
// ══════════════════════════════════════════════════════════
const LocationField = React.memo(({
  label,
  field,
  type,
  setType,
  value,
  onChangeText,
  onGpsPress,
  locationLoading,
  activeField,
  error,
}) => {
  const isPickup = field === 'pickup';
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label} *</Text>
      
      {/* GPS / Manual Toggle */}
      <View style={styles.locTypeRow}>
        <TouchableOpacity
          style={[styles.locTypeBtn, type === 'gps' && styles.locTypeBtnActive]}
          onPress={() => setType('gps')}
        >
          <Text style={[styles.locTypeTxt, type === 'gps' && styles.locTypeTxtActive]}>
            📍 Use GPS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.locTypeBtn, type === 'manual' && styles.locTypeBtnActive]}
          onPress={() => setType('manual')}
        >
          <Text style={[styles.locTypeTxt, type === 'manual' && styles.locTypeTxtActive]}>
            ✏️ Type Manually
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationContainer}>
        <View style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}>
          <Text style={styles.inputIcon}>{isPickup ? '📍' : '🏁'}</Text>
          <TextInput
            style={styles.locationInput}
            placeholder={
              type === 'gps'
                ? 'Tap 📍 to auto-fill location'
                : isPickup
                  ? 'e.g. Lahore Airport, Lahore'
                  : 'e.g. DHA Phase 5, Lahore'
            }
            placeholderTextColor={COLORS.textMuted}
            value={value}
            onChangeText={onChangeText}
            editable={type === 'manual'}
            autoCorrect={false}
            autoCapitalize="words"
            keyboardType="default"
            returnKeyType="next"
            blurOnSubmit={false}
            underlineColorAndroid="transparent"
          />
        </View>
        {type === 'gps' && (
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={onGpsPress}
            disabled={locationLoading}
          >
            {locationLoading && activeField === field ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.gpsTxt}>📍</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorTxt}>⚠️ {error}</Text> : null}
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════
export default function BookingScreen({ route, navigation }) {
  const { vehicle, bookingType } = route.params;
  
  const [loading, setLoading]               = useState(false);
  const [locationLoading, setLocLoading]    = useState(false);
  const [activeField, setActiveField]       = useState(null);
  const [drivers, setDrivers]               = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [farePreview, setFarePreview]       = useState(null);
  const [errors, setErrors]                 = useState({});

  // Location texts
  const [pickupText, setPickupText]   = useState('');
  const [dropoffText, setDropoffText] = useState('');
  const [estimatedKm, setEstimatedKm] = useState('');

  // Location types
  const [pickupType, setPickupType]   = useState('gps');
  const [dropoffType, setDropoffType] = useState('manual');

  // GPS coords
  const [pickupCoords, setPickupCoords]   = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);

  // DateTime
  const [startDate, setStartDate]         = useState(new Date());
  const [endDate, setEndDate]             = useState(null);
  const [showStartDateState, setShowStartDateState] = useState(false);
  const [showStartTimeState, setShowStartTimeState] = useState(false);

  // Rate type & special requests
  const [rateType, setRateType]       = useState('hourly');
  const [specialReq, setSpecialReq]   = useState('');

  // ── On mount ──
  useEffect(() => {
    if (bookingType === 'with-driver') fetchAvailableDrivers();
  }, []);

  // ── Auto distance from GPS coords ──
  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      const km = haversineKm(pickupCoords, dropoffCoords) * ROAD_DISTANCE_FACTOR;
      setEstimatedKm(String(Math.max(1, Math.round(km * 10) / 10)));
    }
  }, [pickupCoords, dropoffCoords]);

  // Estimate route distance from typed locations when GPS is not used.
  useEffect(() => {
    const pickup = pickupText.trim();
    const dropoff = dropoffText.trim();

    if (pickupType !== 'manual' && dropoffType !== 'manual') return;
    if (pickup.length < 4 || dropoff.length < 4) return;
    if (pickupCoords && dropoffCoords) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const [pickupMatches, dropoffMatches] = await Promise.all([
          pickupCoords ? [pickupCoords] : Location.geocodeAsync(`${pickup}, Pakistan`),
          dropoffCoords ? [dropoffCoords] : Location.geocodeAsync(`${dropoff}, Pakistan`),
        ]);

        if (cancelled || !pickupMatches?.length || !dropoffMatches?.length) return;

        const nextPickup = pickupCoords || {
          lat: pickupMatches[0].latitude,
          lon: pickupMatches[0].longitude,
        };
        const nextDropoff = dropoffCoords || {
          lat: dropoffMatches[0].latitude,
          lon: dropoffMatches[0].longitude,
        };
        const km = haversineKm(nextPickup, nextDropoff) * ROAD_DISTANCE_FACTOR;
        if (!pickupCoords) setPickupCoords(nextPickup);
        if (!dropoffCoords) setDropoffCoords(nextDropoff);
        setEstimatedKm(String(Math.max(1, Math.round(km * 10) / 10)));
      } catch {
        // Keep manual distance entry available if geocoding is unavailable.
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pickupText, dropoffText, pickupType, dropoffType, pickupCoords, dropoffCoords]);

  // ── Fare preview trigger ──
  useEffect(() => {
    const km = parseFloat(estimatedKm);
    if (pickupText.trim().length > 2 && dropoffText.trim().length > 2 && km > 0) {
      calculateAutoEndTime(km);
      computeFare(km);
    } else {
      setFarePreview(null);
      setEndDate(null);
    }
  }, [pickupText, dropoffText, estimatedKm, rateType, startDate, selectedDriver]);

  // ── Fetch drivers ──
  const fetchAvailableDrivers = async () => {
    setDriversLoading(true);
    try {
      const res = await api.get('/drivers/available');
      setDrivers(res.data.drivers || []);
    } catch {
      Alert.alert('Error', 'Could not load drivers!');
    } finally {
      setDriversLoading(false);
    }
  };

  // ── Haversine formula ──
  const haversineKm = (c1, c2) => {
    const R = 6371;
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
    const dLon = ((c2.lon - c1.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ── Auto end time ──
  const calculateAutoEndTime = (km) => {
    if (!startDate || km <= 0) return;
    const tripHrs = km / AVG_SPEED_KMH;
    const billed = rateType === 'daily'
      ? Math.max(HOURS_PER_DAY, Math.ceil(tripHrs / HOURS_PER_DAY) * HOURS_PER_DAY)
      : Math.max(1, Math.ceil(tripHrs));
    setEndDate(new Date(startDate.getTime() + billed * 3600000));
  };

  // ── Fare calculation (UPDATED STRATEGY) ──
  const computeFare = (km) => {
    try {
      const distKm = parseFloat(km) || 0;
      const farePerHour = parseFloat(vehicle.fare_per_hour) || 0;
      const farePerDay = parseFloat(vehicle.fare_per_day) || farePerHour * HOURS_PER_DAY;
      const farePerKm = parseFloat(vehicle.fare_per_km) || 0;

      const tripHrs = distKm / AVG_SPEED_KMH;
      const billedHrs = Math.max(1, Math.ceil(tripHrs));
      const billedDays = Math.max(1, Math.ceil(tripHrs / HOURS_PER_DAY));

      let durationCharge = 0;
      let durationLabel = '';

      if (rateType === 'hourly') {
        durationCharge = billedHrs * farePerHour;
        durationLabel = `${billedHrs} hr(s) × Rs.${farePerHour}`;
      } else if (rateType === 'daily') {
        durationCharge = billedDays * farePerDay;
        durationLabel = `${billedDays} day(s) x Rs.${farePerDay}/day`;
      } else {
        durationCharge = 0;
        durationLabel = `Per-KM mode`;
      }

      // Per KM charge is always applied
      const perKmCharge = distKm * farePerKm;

      let driverFee = 0;
      if (bookingType === 'with-driver' && selectedDriver) {
        driverFee = DRIVER_FLAT_FEE;
      }

      // Calculations according to the controller
      const subtotalBeforeDeposit = Math.round(durationCharge + perKmCharge + driverFee);
      const taxAmt = Math.round(subtotalBeforeDeposit * GST_RATE);
      const totalAmount = subtotalBeforeDeposit + taxAmt + DEPOSIT_AMOUNT;

      setFarePreview({
        rate_type: rateType,
        duration_label: durationLabel,
        duration_charge: Math.round(durationCharge),
        per_km_charge: Math.round(perKmCharge),
        distance_km: distKm,
        fare_per_km: farePerKm,
        fare_per_day: farePerDay,
        fare_per_hour: farePerHour,
        driver_fee: driverFee,
        subtotal: subtotalBeforeDeposit,
        tax_amount: taxAmt,
        deposit_amount: DEPOSIT_AMOUNT,
        total_amount: totalAmount,
      });
    } catch {
      setFarePreview(null);
    }
  };

  // ── GPS fetch ──
  const getGPSLocation = async (field) => {
    setActiveField(field);
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable location!');
        return;
      }
      const prov = await Location.getProviderStatusAsync();
      if (!prov.locationServicesEnabled) {
        Alert.alert('GPS Off', 'Please turn on GPS!');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const addr = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const coords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      
      if (addr.length > 0) {
        const a = addr[0];
        const full = [a.name, a.street, a.district, a.city, a.region].filter(Boolean).join(', ');
        if (field === 'pickup') {
          setPickupText(full);
          setPickupCoords(coords);
        } else {
          setDropoffText(full);
          setDropoffCoords(coords);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not get location. Type manually!');
    } finally {
      setLocLoading(false);
      setActiveField(null);
    }
  };

  // ── Stable callbacks for LocationField (prevents re-renders) ──
  const onPickupChange = useCallback((val) => {
    setPickupText(val);
    setPickupCoords(null);
    setErrors((p) => ({ ...p, pickup: null }));
  }, []);

  const onDropoffChange = useCallback((val) => {
    setDropoffText(val);
    setDropoffCoords(null);
    setErrors((p) => ({ ...p, dropoff: null }));
  }, []);

  const onPickupGps = useCallback(() => getGPSLocation('pickup'), []);
  const onDropoffGps = useCallback(() => getGPSLocation('dropoff'), []);

  // ── Formatters ──
  const fmt = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${mo}-${d} ${h}:${mi}:00`;
  };

  const fmtDisplay = (date) =>
    date
      ? date.toLocaleString('en-PK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--';

  // ── Validate ──
  const validate = () => {
    const errs = {};
    const pickup = pickupText.trim();
    const dropoff = dropoffText.trim();
    const km = parseFloat(estimatedKm);

    if (!pickup) errs.pickup = 'Pickup location required!';
    if (!dropoff) errs.dropoff = 'Dropoff location required!';
    if (pickup && dropoff && pickup.toLowerCase() === dropoff.toLowerCase())
      errs.dropoff = 'Pickup aur dropoff same nahi ho sakti!';
    if (!estimatedKm || isNaN(km) || km <= 0 || km > 2000)
      errs.distance = 'Distance 1 se 2000 km ke darmiyan hona chahiye!';
    if (!endDate) errs.time = 'Please fill locations and distance first!';
    if (bookingType === 'with-driver' && !selectedDriver)
      errs.driver = 'Please select a driver!';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Handle Booking ──
  const handleBooking = async () => {
    if (!validate()) {
      Alert.alert('Incomplete', 'Please fix the errors!');
      return;
    }
    setLoading(true);
    try {
      let response;
      if (bookingType === 'with-driver') {
        response = await api.post('/bookings/with-driver', {
          vehicle_id: vehicle.vehicle_id,
          driver_id: selectedDriver.driver_id,
          start_time: fmt(startDate),
          end_time: fmt(endDate),
          rate_type: rateType,
          pickup_location: pickupText.trim(),
          dropoff_location: dropoffText.trim(),
          estimated_distance: parseFloat(estimatedKm),
          special_requests: specialReq,
        });
      } else {
        response = await api.post('/bookings/without-driver', {
          vehicle_id: vehicle.vehicle_id,
          start_date: fmt(startDate),
          end_date: fmt(endDate),
          rate_type: rateType,
          self_pickup_location: pickupText.trim(),
          onsite_location: dropoffText.trim(),
          estimated_distance: parseFloat(estimatedKm),
          special_requests: specialReq,
        });
      }

      const fare = response.data.fare_details;
      Alert.alert(
        '✅ Booking Successful!',
          `Receipt: ${response.data.receipt_number}\n\n` +
          (fare?.duration_charge > 0 ? `Duration Fare:  Rs. ${fare.duration_charge}\n` : '') +
          `Distance Fare:  Rs. ${fare?.per_km_charge || 0}\n` +
          (fare?.driver_fee > 0 ? `Driver Fee:     Rs. ${fare.driver_fee}\n` : '') +
          `Tax (5%):       Rs. ${fare?.tax_amount || 0}\n` +
          `Deposit (Ref):  Rs. ${fare?.deposit_amount || DEPOSIT_AMOUNT}\n` +
          `─────────────────────\n` +
          `PAY NOW:        Rs. ${response.data.total_amount}`,
        [
          {
            text: 'Pay Now 💳',
            onPress: () =>
              navigation.navigate('Payment', {
                booking_id: response.data.booking_id,
                booking_type: bookingType,
                total_amount: response.data.total_amount,
                receipt_number: response.data.receipt_number,
                fare_details: fare,
              }),
          },
          { text: 'Pay Later', onPress: () => navigation.navigate('MyBookings') },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Booking failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Vehicle Header ── */}
        <View style={styles.headerCard}>
          <Text style={styles.vehicleIcon}>🚗</Text>
          <Text style={styles.title}>{vehicle.model}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.subtitle}>
              {bookingType === 'with-driver' ? '👨‍✈️ With Driver' : '🚗 Self Drive'}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Per Hour</Text>
              <Text style={styles.priceVal}>Rs. {vehicle.fare_per_hour}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Per Day (12hr)</Text>
              <Text style={styles.priceVal}>
                Rs. {vehicle.fare_per_day || Math.round(parseFloat(vehicle.fare_per_hour || 0) * HOURS_PER_DAY)}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Per KM</Text>
              <Text style={styles.priceVal}>Rs. {vehicle.fare_per_km || 0}</Text>
            </View>
          </View>
        </View>

        {/* ── Booking Form ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📋 Booking Details</Text>

          {/* Pickup Location */}
          <LocationField
            label="Pickup Location"
            field="pickup"
            type={pickupType}
            setType={setPickupType}
            value={pickupText}
            onChangeText={onPickupChange}
            onGpsPress={onPickupGps}
            locationLoading={locationLoading}
            activeField={activeField}
            error={errors.pickup}
          />

          {/* Dropoff Location */}
          <LocationField
            label="Dropoff Location"
            field="dropoff"
            type={dropoffType}
            setType={setDropoffType}
            value={dropoffText}
            onChangeText={onDropoffChange}
            onGpsPress={onDropoffGps}
            locationLoading={locationLoading}
            activeField={activeField}
            error={errors.dropoff}
          />

          {/* Distance */}
          <Text style={styles.label}>Estimated Distance (KM) *</Text>
          <View style={[styles.inputWrapper, errors.distance && styles.inputError]}>
            <Text style={styles.inputIcon}>🛣️</Text>
            <TextInput
              style={styles.input}
              placeholder={
                pickupCoords && dropoffCoords
                  ? 'Auto-calculated from selected locations'
                  : 'Enter distance manually (e.g. 25)'
              }
              placeholderTextColor={COLORS.textMuted}
              value={estimatedKm}
              onChangeText={(val) => {
                setEstimatedKm(val.replace(/[^0-9.]/g, ''));
                setErrors((p) => ({ ...p, distance: null }));
              }}
              keyboardType="numeric"
              maxLength={6}
            />
            <Text style={styles.unitTxt}>km</Text>
          </View>
          {errors.distance ? (
            <Text style={styles.errorTxt}>⚠️ {errors.distance}</Text>
          ) : pickupCoords && dropoffCoords && estimatedKm ? (
            <Text style={styles.autoCalcNote}>📍 Auto-calculated from selected locations</Text>
          ) : null}

          {/* Start Date/Time */}
          <Text style={styles.label}>Start Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDateState(true)}>
              <Text style={styles.dateTxt}>📅 {startDate.toLocaleDateString('en-PK')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowStartTimeState(true)}>
              <Text style={styles.dateTxt}>
                🕐 {startDate.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.selectedInfo}>Start: {fmtDisplay(startDate)}</Text>

          {showStartDateState && (
            <DateTimePicker
              value={startDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(e, d) => {
                setShowStartDateState(false);
                if (d) setStartDate(new Date(d.setHours(startDate.getHours(), startDate.getMinutes())));
              }}
            />
          )}
          {showStartTimeState && (
            <DateTimePicker
              value={startDate}
              mode="time"
              onChange={(e, d) => {
                setShowStartTimeState(false);
                if (d) setStartDate(new Date(startDate.setHours(d.getHours(), d.getMinutes())));
              }}
            />
          )}

          {/* Auto End Time */}
          {endDate ? (
            <View style={styles.autoEndCard}>
              <Text style={styles.autoEndLabel}>⏰ Auto-Calculated End Time</Text>
              <Text style={styles.autoEndTime}>{fmtDisplay(endDate)}</Text>
              <Text style={styles.autoEndNote}>
                Based on {estimatedKm} km ÷ {AVG_SPEED_KMH} km/h avg speed
              </Text>
            </View>
          ) : null}
          {errors.time && <Text style={styles.errorTxt}>⚠️ {errors.time}</Text>}

          {/* Rate Type */}
          <Text style={styles.label}>Rate Type</Text>
          <View style={styles.rowContainer}>
            {[
              { key: 'hourly', label: '⏱️ Hourly' },
              { key: 'daily', label: '📅 Daily' },
              { key: 'per_km', label: '🛣️ Per KM' },
            ].map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.rateBtn, rateType === r.key && styles.rateBtnActive]}
                onPress={() => setRateType(r.key)}
              >
                <Text style={[styles.rateTxt, rateType === r.key && styles.rateTxtActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fare Preview */}
          {farePreview && (
            <View style={styles.fareCard}>
              <Text style={styles.fareTitle}>💰 Estimated Fare</Text>
              
              {farePreview.duration_charge > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Duration Fare</Text>
                  <Text style={styles.fareVal}>Rs. {farePreview.duration_charge}</Text>
                </View>
              )}
              {farePreview.duration_charge > 0 && (
                <Text style={styles.fareSub}>{farePreview.duration_label}</Text>
              )}

              {farePreview.per_km_charge > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Distance ({farePreview.distance_km} km × Rs.{farePreview.fare_per_km})</Text>
                  <Text style={styles.fareVal}>Rs. {farePreview.per_km_charge}</Text>
                </View>
              )}

              {farePreview.driver_fee > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>👨‍✈️ Driver Fee</Text>
                  <Text style={[styles.fareVal, { color: COLORS.light }]}>
                    Rs. {farePreview.driver_fee}
                  </Text>
                </View>
              )}

              <View style={styles.fareDivider} />
              
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Subtotal</Text>
                <Text style={styles.fareVal}>Rs. {farePreview.subtotal}</Text>
              </View>
              
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Tax (5% GST)</Text>
                <Text style={styles.fareVal}>Rs. {farePreview.tax_amount}</Text>
              </View>

              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Deposit (Refundable)</Text>
                <Text style={[styles.fareVal, { color: COLORS.orange }]}>Rs. {farePreview.deposit_amount}</Text>
              </View>

              <View style={[styles.fareRow, { marginTop: 10 }]}>
                <Text style={styles.fareTotalLabel}>PAY NOW</Text>
                <Text style={styles.fareTotalVal}>Rs. {farePreview.total_amount}</Text>
              </View>
            </View>
          )}

          {/* Driver Selection */}
          {bookingType === 'with-driver' && (
            <>
              <Text style={styles.label}>Select Driver *</Text>
              {driversLoading ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 15 }} />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16, marginBottom: 16 }}
                >
                  {drivers.map((driver) => {
                    const exp = parseInt(driver.experience_years) || 0;

                    return (
                      <TouchableOpacity
                        key={driver.driver_id}
                        style={[
                          styles.driverCard,
                          selectedDriver?.driver_id === driver.driver_id && styles.driverCardActive,
                        ]}
                        onPress={() => {
                          setSelectedDriver(driver);
                          setErrors((p) => ({ ...p, driver: null }));
                        }}
                      >
                        <Text style={styles.driverIconTxt}>👨‍✈️</Text>
                        <Text style={styles.driverName}>{driver.name}</Text>
                        <Text style={styles.driverSub}>⭐ {driver.rating || 'N/A'}</Text>
                        <Text style={styles.driverSub}>📅 {exp} yrs exp</Text>
                        <View style={styles.driverFeeBadge}>
                          <Text style={styles.driverFeeText}>Rs. {DRIVER_FLAT_FEE}</Text>
                        </View>
                        <Text style={styles.driverMinFee}>Flat Fee</Text>
                        {selectedDriver?.driver_id === driver.driver_id && (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeTxt}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
              {errors.driver && <Text style={styles.errorTxt}>⚠️ {errors.driver}</Text>}
            </>
          )}

          {/* Special Requests */}
          <Text style={styles.label}>Special Requests (Optional)</Text>
          <View style={[styles.inputWrapper, { alignItems: 'flex-start' }]}>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any special requests..."
              placeholderTextColor={COLORS.textMuted}
              value={specialReq}
              onChangeText={setSpecialReq}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </View>
          <Text style={styles.charCount}>{specialReq.length}/300</Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.bookBtn, loading && { opacity: 0.7 }]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.bookTxt}>🚀 Confirm Booking</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.navy },
  circle1:          { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(46,134,222,0.1)', top: -80, right: -80 },
  circle2:          { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(79,195,247,0.07)', bottom: 100, left: -60 },
  scrollContent:    { padding: 16, paddingTop: 20 },
  headerCard:       { backgroundColor: COLORS.glass, borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  vehicleIcon:      { fontSize: 44, marginBottom: 10 },
  title:            { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 8 },
  typeBadge:        { backgroundColor: 'rgba(46,134,222,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 14 },
  subtitle:         { fontSize: 13, color: COLORS.light, fontWeight: '700' },
  pricingRow:       { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  priceItem:        { flex: 1, alignItems: 'center' },
  priceLabel:       { color: COLORS.textMuted, fontSize: 11, marginBottom: 3 },
  priceVal:         { color: COLORS.green, fontSize: 13, fontWeight: '700' },
  priceDivider:     { width: 1, height: 28, backgroundColor: COLORS.glassBorder },
  card:             { backgroundColor: COLORS.glass, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  sectionTitle:     { fontSize: 17, fontWeight: '800', color: COLORS.white, marginBottom: 18 },
  label:            { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, fontWeight: '600', letterSpacing: 0.3 },
  locTypeRow:       { flexDirection: 'row', gap: 8, marginBottom: 8 },
  locTypeBtn:       { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', backgroundColor: COLORS.inputBg },
  locTypeBtnActive: { backgroundColor: 'rgba(46,134,222,0.2)', borderColor: COLORS.accent },
  locTypeTxt:       { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  locTypeTxtActive: { color: COLORS.light },
  locationContainer:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationInput:    { flex: 1, color: COLORS.white, fontSize: 14, paddingVertical: 12 },
  gpsBtn:           { backgroundColor: COLORS.accent, padding: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minWidth: 48, minHeight: 50 },
  gpsTxt:           { fontSize: 18 },
  autoCalcNote:     { fontSize: 11, color: COLORS.light, marginTop: -12, marginBottom: 12 },
  inputWrapper:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 12, marginBottom: 16, minHeight: 50 },
  inputError:       { borderColor: COLORS.red },
  inputIcon:        { fontSize: 15, marginRight: 8 },
  input:            { flex: 1, color: COLORS.white, fontSize: 14, paddingVertical: 12 },
  unitTxt:          { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  dateTimeRow:      { flexDirection: 'row', gap: 10, marginBottom: 6 },
  dateBtn:          { flex: 1, backgroundColor: COLORS.inputBg, padding: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  timeBtn:          { flex: 1, backgroundColor: COLORS.inputBg, padding: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  dateTxt:          { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  selectedInfo:     { fontSize: 11, color: COLORS.green, marginBottom: 16, fontWeight: '600' },
  autoEndCard:      { backgroundColor: 'rgba(46,134,222,0.12)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(46,134,222,0.3)' },
  autoEndLabel:     { fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontWeight: '600' },
  autoEndTime:      { fontSize: 15, color: COLORS.white, fontWeight: '800', marginBottom: 3 },
  autoEndNote:      { fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' },
  errorTxt:         { color: COLORS.red, fontSize: 11, marginTop: -10, marginBottom: 12, fontWeight: '600' },
  fareCard:         { backgroundColor: 'rgba(38,208,124,0.08)', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(38,208,124,0.25)' },
  fareTitle:        { color: COLORS.green, fontSize: 14, fontWeight: '800', marginBottom: 10 },
  fareRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fareLabel:        { color: COLORS.textMuted, fontSize: 12 },
  fareVal:          { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  fareSub:          { color: COLORS.textMuted, fontSize: 10, marginTop: -4, marginBottom: 8, fontStyle: 'italic' },
  fareDivider:      { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
  fareTotalLabel:   { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  fareTotalVal:     { color: COLORS.green, fontSize: 18, fontWeight: '800' },
  rowContainer:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rateBtn:          { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', backgroundColor: COLORS.inputBg },
  rateBtnActive:    { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  rateTxt:          { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  rateTxtActive:    { color: COLORS.white },
  driverCard:       { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginRight: 10, borderWidth: 1, borderColor: COLORS.glassBorder, width: 140, alignItems: 'center' },
  driverCardActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(46,134,222,0.12)' },
  driverIconTxt:    { fontSize: 28, marginBottom: 6 },
  driverName:       { fontSize: 12, fontWeight: '700', color: COLORS.white, textAlign: 'center', marginBottom: 4 },
  driverSub:        { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  driverFeeBadge:   { backgroundColor: 'rgba(46,134,222,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  driverFeeText:    { color: COLORS.light, fontSize: 11, fontWeight: '700' },
  driverMinFee:     { color: COLORS.textMuted, fontSize: 10, marginTop: 2, marginBottom: 4 },
  selectedBadge:    { backgroundColor: COLORS.green, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  selectedBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  textarea:         { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 },
  charCount:        { color: COLORS.textMuted, fontSize: 10, textAlign: 'right', marginTop: -12, marginBottom: 12 },
  bookBtn:          { backgroundColor: COLORS.accent, padding: 18, borderRadius: 16, alignItems: 'center' },
  bookTxt:          { color: COLORS.white, fontSize: 17, fontWeight: '800' },
});