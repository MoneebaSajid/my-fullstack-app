import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  KeyboardAvoidingView, Platform, SafeAreaView, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [role, setRole] = useState('passenger');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    cnic: '',
    date_of_birth: '',
    gender: 'Male',
    nationality: 'Pakistani',
    license_number: '',
  });

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const addressRef = useRef(null);
  const cnicRef = useRef(null);
  const licenseRef = useRef(null);
  const nationalityRef = useRef(null);

  // ── Pick Profile Image ──
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not pick image!');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not take photo!');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: '📷 Take Photo', onPress: takePhoto },
        { text: '🖼️ Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // ── Date Change ──
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setForm({ ...form, date_of_birth: `${year}-${month}-${day}` });
    }
  };

  // ── Register ──
 const handleRegister = async () => {
  if (!form.name || !form.email || !form.password || !form.phone || !form.date_of_birth) {
    Alert.alert('Error', 'Please fill all required fields!');
    return;
  }
// handleRegister mein add karo:
if (form.password.length < 6) {
  Alert.alert('Error', 'Password kam se kam 6 characters ka hona chahiye!');
  return;
}
if (!/(?=.*[0-9])/.test(form.password)) {
  Alert.alert('Error', 'Password mein kam se kam ek number hona chahiye!');
  return;
}
  if (role === 'driver' && !form.license_number) {
    Alert.alert('Error', 'License number is required for drivers!');
    return;
  }

  setLoading(true);
  try {
    let endpoint;
    if (role === 'driver') {
      endpoint = '/auth/driver/register';
    } else if (role === 'admin') {
      endpoint = '/auth/admin/register';
    } else {
      endpoint = '/auth/passenger/register';
    }

    await api.post(endpoint, form);

    Alert.alert(
      '✅ Success!',
      `Account created as ${role}! Please login.`,
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );

  } catch (error) {
    Alert.alert('Error',
      error.response?.data?.message ||
      error.message ||
      'Registration failed!'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>🚗 Create Account</Text>

          {/* Role Selection — horizontal row */}
          <View style={styles.roleRow}>
            {[
              { key: 'passenger', label: '👤 Passenger' },
              { key: 'driver', label: '🚗 Driver' },
              // { key: 'admin', label: '👑 Admin' },
            ].map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                onPress={() => setRole(r.key)}
              >
                <Text style={[styles.roleTxt, role === r.key && styles.roleTxtActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subtitle}>
            Registering as {role === 'driver' ? '🚗 Driver' : '👤 Passenger'}
          </Text>

          {/* Profile Picture */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={showImageOptions}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarIcon}>📷</Text>
                <Text style={styles.avatarTxt}>Add Photo</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeTxt}>✏️</Text>
            </View>
          </TouchableOpacity>

          {/* Section Label */}
          <Text style={styles.sectionLabel}>Personal Info</Text>

          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={form.name}
              onChangeText={(val) => setForm({ ...form, name: val })}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={form.email}
              onChangeText={(val) => setForm({ ...form, email: val.trim() })}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              ref={phoneRef}
              style={styles.input}
              placeholder="Phone *"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={form.phone}
              onChangeText={(val) => setForm({ ...form, phone: val })}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              ref={passwordRef}
              style={[styles.input, { flex: 1 }]}
              placeholder="Password *"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={form.password}
              onChangeText={(val) => setForm({ ...form, password: val })}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => addressRef.current.focus()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeTxt}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Section Label */}
          <Text style={styles.sectionLabel}>Additional Details</Text>

          {/* Address */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              ref={addressRef}
              style={styles.input}
              placeholder="Address"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={form.address}
              onChangeText={(val) => setForm({ ...form, address: val })}
              returnKeyType="next"
              onSubmitEditing={() => cnicRef.current.focus()}
              blurOnSubmit={false}
            />
          </View>
// CNIC field ki jagah yeh add karo:
<TextInput
  style={styles.input}
  placeholder="CNIC (e.g. 35201-1234567-1)"
  value={form.cnic}
  onChangeText={(val) => {
    // Sirf numbers aur dash allow karo
    let cleaned = val.replace(/[^0-9]/g, '');
    // Pakistani format: 13 digits → XXXXX-XXXXXXX-X
    if (cleaned.length <= 5) {
      setForm({ ...form, cnic: cleaned });
    } else if (cleaned.length <= 12) {
      setForm({ ...form, cnic: `${cleaned.slice(0,5)}-${cleaned.slice(5)}` });
    } else if (cleaned.length <= 13) {
      setForm({ ...form, cnic: `${cleaned.slice(0,5)}-${cleaned.slice(5,12)}-${cleaned.slice(12)}` });
    }
  }}
  keyboardType="numeric"
  maxLength={15} // 13 digits + 2 dashes
/>
<TextInput
  style={styles.input}
  placeholder="Phone (03XXXXXXXXX)"
  value={form.phone}
  onChangeText={(val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length <= 11) {
      setForm({ ...form, phone: cleaned });
    }
  }}
  keyboardType="numeric"
  maxLength={11}
/>
<TextInput
  style={styles.input}
  placeholder="Full Name *"
  value={form.name}
  onChangeText={(val) => {
    const cleaned = val.replace(/[^a-zA-Z\s]/g, '');
    setForm({ ...form, name: cleaned });
  }}
  maxLength={50}
/>

          {/* CNIC */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🪪</Text>
            <TextInput
              ref={cnicRef}
              style={styles.input}
              placeholder="CNIC (e.g. 35201-1234567-1)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={form.cnic}
              onChangeText={(val) => setForm({ ...form, cnic: val })}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
<TextInput
  style={styles.input}
  placeholder="License Number (e.g. LHR-12-3456)"
  value={form.license_number}
  onChangeText={(val) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setForm({ ...form, license_number: cleaned });
  }}
  maxLength={15}
  autoCapitalize="characters"
/>
          {/* License Number — Driver Only */}
          {role === 'driver' && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🪪</Text>
              <TextInput
                ref={licenseRef}
                style={styles.input}
                placeholder="License Number * (Driver Only)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={form.license_number}
                onChangeText={(val) => setForm({ ...form, license_number: val })}
                returnKeyType="next"
                onSubmitEditing={() => nationalityRef.current.focus()}
                blurOnSubmit={false}
              />
            </View>
          )}

          {/* Gender */}
          <View style={styles.rowContainer}>
            <Text style={styles.label}>Gender:</Text>
            {['Male', 'Female'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.optionBtn, form.gender === g && styles.optionBtnActive]}
                onPress={() => setForm({ ...form, gender: g })}
              >
                <Text style={[styles.optionTxt, form.gender === g && styles.optionTxtActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date of Birth */}
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputIcon}>📅</Text>
            <Text style={{ color: form.date_of_birth ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 15, flex: 1 }}>
              {form.date_of_birth ? `DOB: ${form.date_of_birth}` : 'Select Date of Birth *'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={form.date_of_birth ? new Date(form.date_of_birth) : new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Nationality */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🌍</Text>
            <TextInput
              ref={nationalityRef}
              style={styles.input}
              placeholder="Nationality"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={form.nationality}
              onChangeText={(val) => setForm({ ...form, nationality: val })}
              returnKeyType="done"
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerTxt}>
                {role === 'driver' ? '🚗 Register as Driver' : '👤 Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginTxt}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#0A1628',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 40 : 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 20,
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
  },

  // ── Role Row ──
  roleRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  roleBtnActive: {
    backgroundColor: '#2E86DE',
    borderColor: '#2E86DE',
  },
  roleTxt: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  roleTxtActive: {
    color: '#FFFFFF',
  },

  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 22,
    alignSelf: 'flex-start',
    letterSpacing: 0.3,
  },

  // ── Avatar ──
  avatarContainer: {
    marginBottom: 28,
    position: 'relative',
    alignSelf: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#2E86DE',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(46,134,222,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(46,134,222,0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 26,
  },
  avatarTxt: {
    fontSize: 11,
    color: '#4FC3F7',
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2E86DE',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A1628',
  },
  avatarBadgeTxt: {
    fontSize: 11,
  },

  // ── Section Label ──
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#4FC3F7',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 4,
  },

  // ── Input Row ──
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 52,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    height: '100%',
  },

  // ── Password ──
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    height: 52,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  eyeTxt: {
    fontSize: 18,
  },

  // ── Gender Row ──
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    gap: 10,
  },
  label: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  optionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  optionBtnActive: {
    backgroundColor: '#2E86DE',
    borderColor: '#2E86DE',
  },
  optionTxt: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTxtActive: {
    color: '#fff',
  },

  // ── Register Button ──
  registerBtn: {
    width: '100%',
    backgroundColor: '#2E86DE',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  registerTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  loginTxt: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
});