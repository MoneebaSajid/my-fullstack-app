import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  KeyboardAvoidingView, Platform, SafeAreaView,
  StatusBar, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const COLORS = {
  navy:        '#0A1628',
  accent:      '#2E86DE',
  light:       '#4FC3F7',
  white:       '#FFFFFF',
  glass:       'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  inputBg:     'rgba(255,255,255,0.06)',
  textMuted:   'rgba(255,255,255,0.55)',
  green:       '#26D07C',
  red:         '#FF4757',
};

// ── Section Label ──
const SectionLabel = ({ title, color = COLORS.light }) => (
  <Text style={[styles.sectionLabel, { color }]}>{title}</Text>
);

// ── Input Field ──
const InputField = ({
  icon, placeholder, value, onChangeText,
  keyboardType = 'default', secureTextEntry = false,
  autoCapitalize = 'sentences', maxLength,
  returnKeyType = 'next', onSubmitEditing, inputRef,
  rightElement, editable = true,
}) => (
  <View style={[styles.inputWrapper, !editable && { opacity: 0.6 }]}>
    <Text style={styles.inputIcon}>{icon}</Text>
    <TextInput
      ref={inputRef}
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      blurOnSubmit={false}
      editable={editable}
    />
    {rightElement}
  </View>
);

export default function RegisterScreen({ navigation }) {
  const [loading,        setLoading]        = useState(false);
  const [showPassword,   setShowPassword]   = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage,   setProfileImage]   = useState(null);
  const [role,           setRole]           = useState('passenger');

  const [form, setForm] = useState({
    name:           '',
    email:          '',
    phone:          '',
    password:       '',
    address:        '',
    cnic:           '',
    date_of_birth:  '',
    gender:         'Male',
    nationality:    'Pakistani',
    license_number: '',
  });

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // ── Refs ──
  const emailRef       = useRef(null);
  const phoneRef       = useRef(null);
  const passwordRef    = useRef(null);
  const addressRef     = useRef(null);
  const cnicRef        = useRef(null);
  const licenseRef     = useRef(null);
  const nationalityRef = useRef(null);

  // ── CNIC formatter ──
  const formatCnic = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 13);
    if (d.length > 12) return `${d.slice(0,5)}-${d.slice(5,12)}-${d.slice(12)}`;
    if (d.length > 5)  return `${d.slice(0,5)}-${d.slice(5)}`;
    return d;
  };

  // ── Image picker ──
  const showImageOptions = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: '📷 Take Photo',         onPress: takePhoto  },
      { text: '🖼️ Choose from Gallery', onPress: pickImage  },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Allow photo library access!'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Allow camera access!'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  // ── Date picker ──
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const y  = selectedDate.getFullYear();
      const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d  = String(selectedDate.getDate()).padStart(2, '0');
      updateForm('date_of_birth', `${y}-${mo}-${d}`);
    }
  };

  // ── Validate ──
  const validate = () => {
    const { name, email, password, phone, date_of_birth, cnic, license_number } = form;
    if (!name.trim())         { Alert.alert('Error', 'Name is required!');         return false; }
    if (!email.trim())        { Alert.alert('Error', 'Email is required!');        return false; }
    if (!phone.trim())        { Alert.alert('Error', 'Phone is required!');        return false; }
    if (phone.length !== 11)  { Alert.alert('Error', 'Phone must be 11 digits!'); return false; }
    if (!date_of_birth)       { Alert.alert('Error', 'Date of birth required!');  return false; }
    if (!cnic.trim())         { Alert.alert('Error', 'CNIC is required!');        return false; }
    if (password.length < 6)  { Alert.alert('Error', 'Password must be at least 6 characters!'); return false; }
    if (!/[0-9]/.test(password)) { Alert.alert('Error', 'Password must contain at least one number!'); return false; }
    if (role === 'driver' && !license_number.trim()) {
      Alert.alert('Error', 'License number required for drivers!');
      return false;
    }
    return true;
  };

  // ── Register ──
  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const endpoint = role === 'driver'
        ? '/auth/driver/register'
        : '/auth/passenger/register';

      await api.post(endpoint, form);

      Alert.alert(
        '✅ Account Created!',
        `Registered as ${role}. Please login.`,
        [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnTxt}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join NexRide today 🚗</Text>
            </View>
          </View>

          {/* ── Role Selection ── */}
          <View style={styles.roleRow}>
            {[
              { key: 'passenger', label: 'Passenger', icon: '👤' },
              { key: 'driver',    label: 'Driver',    icon: '🚗' },
            ].map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                onPress={() => setRole(r.key)}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text style={[styles.roleTxt, role === r.key && styles.roleTxtActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Profile Picture ── */}
          <TouchableOpacity style={styles.avatarWrap} onPress={showImageOptions}>
            <View style={styles.avatarCircle}>
              {profileImage ? (
                <Text style={{ fontSize: 44 }}>🖼️</Text>
              ) : (
                <>
                  <Text style={styles.avatarIcon}>📷</Text>
                  <Text style={styles.avatarTxt}>Add Photo</Text>
                </>
              )}
            </View>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeTxt}>✏️</Text>
            </View>
          </TouchableOpacity>

          {/* ── Personal Info ── */}
          <SectionLabel title="👤  Personal Information" />

          <InputField
            icon="👤"
            placeholder="Full Name *"
            value={form.name}
            onChangeText={(val) => updateForm('name', val.replace(/[^a-zA-Z\s]/g, ''))}
            autoCapitalize="words"
            maxLength={50}
            inputRef={null}
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <InputField
            icon="✉️"
            placeholder="Email Address *"
            value={form.email}
            onChangeText={(val) => updateForm('email', val.trim())}
            keyboardType="email-address"
            autoCapitalize="none"
            inputRef={emailRef}
            onSubmitEditing={() => phoneRef.current?.focus()}
          />

          <InputField
            icon="📱"
            placeholder="Phone Number (03XXXXXXXXX) *"
            value={form.phone}
            onChangeText={(val) => {
              const cleaned = val.replace(/\D/g, '').slice(0, 11);
              updateForm('phone', cleaned);
            }}
            keyboardType="numeric"
            maxLength={11}
            inputRef={phoneRef}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <InputField
            icon="🔒"
            placeholder="Password (min 6 chars + 1 number) *"
            value={form.password}
            onChangeText={(val) => updateForm('password', val)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            inputRef={passwordRef}
            onSubmitEditing={() => addressRef.current?.focus()}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeTxt}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          {/* ── Additional Details ── */}
          <SectionLabel title="📋  Additional Details" />

          <InputField
            icon="📍"
            placeholder="Address"
            value={form.address}
            onChangeText={(val) => updateForm('address', val)}
            inputRef={addressRef}
            onSubmitEditing={() => cnicRef.current?.focus()}
          />

          <InputField
            icon="🪪"
            placeholder="CNIC (XXXXX-XXXXXXX-X) *"
            value={form.cnic}
            onChangeText={(val) => updateForm('cnic', formatCnic(val))}
            keyboardType="numeric"
            maxLength={15}
            inputRef={cnicRef}
            onSubmitEditing={() => nationalityRef.current?.focus()}
          />

          <InputField
            icon="🌍"
            placeholder="Nationality"
            value={form.nationality}
            onChangeText={(val) => updateForm('nationality', val)}
            inputRef={nationalityRef}
            returnKeyType="done"
          />

          {/* Gender */}
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                onPress={() => updateForm('gender', g)}
              >
                <Text style={styles.genderIcon}>{g === 'Male' ? '👨' : '👩'}</Text>
                <Text style={[styles.genderTxt, form.gender === g && styles.genderTxtActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date of Birth */}
          <Text style={styles.fieldLabel}>Date of Birth *</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputIcon}>📅</Text>
            <Text style={[
              styles.dobTxt,
              !form.date_of_birth && { color: COLORS.textMuted }
            ]}>
              {form.date_of_birth ? form.date_of_birth : 'Select Date of Birth'}
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

          {/* ── Driver Only Section ── */}
          {role === 'driver' && (
            <>
              <SectionLabel title="🚗  Driver Information" color={COLORS.green} />

              <InputField
                icon="🪪"
                placeholder="Driving License Number *"
                value={form.license_number}
                onChangeText={(val) => updateForm('license_number', val.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                autoCapitalize="characters"
                maxLength={20}
                inputRef={licenseRef}
                returnKeyType="done"
              />

              <View style={styles.driverInfoBox}>
                <Text style={styles.driverInfoTxt}>
                  {'ℹ️ As a driver, your license will be verified before your first booking is assigned.'}
                </Text>
              </View>
            </>
          )}

          {/* ── Register Button ── */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.75 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : (
                <Text style={styles.registerTxt}>
                  {role === 'driver' ? '🚗 Register as Driver' : '✨ Create Account'}
                </Text>
              )
            }
          </TouchableOpacity>

          {/* Login link */}
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkTxt}>
              {'Already have an account? '}
              <Text style={{ color: COLORS.light, fontWeight: '800' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.navy },
  blob1:        { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(46,134,222,0.1)', top: -80, right: -80 },
  blob2:        { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(79,195,247,0.06)', bottom: 80, left: -60 },
  scrollContent:{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, paddingTop: 8 },
  backBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:   { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  title:        { fontSize: 24, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
  subtitle:     { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  // Role tabs
  roleRow:      { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleBtn:      { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.inputBg },
  roleBtnActive:{ backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  roleIcon:     { fontSize: 20, marginBottom: 4 },
  roleTxt:      { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  roleTxtActive:{ color: COLORS.white },

  // Avatar
  avatarWrap:   { alignSelf: 'center', marginBottom: 28, position: 'relative' },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(46,134,222,0.12)', borderWidth: 2, borderColor: 'rgba(46,134,222,0.4)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  avatarIcon:   { fontSize: 28 },
  avatarTxt:    { fontSize: 11, color: COLORS.light, marginTop: 4, fontWeight: '700' },
  avatarBadge:  { position: 'absolute', bottom: 2, right: 2, backgroundColor: COLORS.accent, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.navy },
  avatarBadgeTxt: { fontSize: 12 },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  fieldLabel:   { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },

  // Input
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 14, marginBottom: 12, minHeight: 52 },
  inputIcon:    { fontSize: 16, marginRight: 10 },
  input:        { flex: 1, color: COLORS.white, fontSize: 14, paddingVertical: 14 },
  eyeBtn:       { padding: 6 },
  eyeTxt:       { fontSize: 18 },
  dobTxt:       { flex: 1, color: COLORS.white, fontSize: 14, paddingVertical: 14 },

  // Gender
  genderRow:      { flexDirection: 'row', gap: 12, marginBottom: 14 },
  genderBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.inputBg },
  genderBtnActive:{ backgroundColor: 'rgba(46,134,222,0.2)', borderColor: COLORS.accent },
  genderIcon:     { fontSize: 18 },
  genderTxt:      { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  genderTxtActive:{ color: COLORS.white },

  // Driver info box
  driverInfoBox:{ backgroundColor: 'rgba(38,208,124,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(38,208,124,0.25)', marginBottom: 12 },
  driverInfoTxt:{ color: 'rgba(38,208,124,0.9)', fontSize: 12, lineHeight: 18 },

  // Register btn
  registerBtn:  { backgroundColor: COLORS.accent, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 14, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  registerTxt:  { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Login link
  loginLink:    { alignItems: 'center', paddingVertical: 8 },
  loginLinkTxt: { color: COLORS.textMuted, fontSize: 14 },
});