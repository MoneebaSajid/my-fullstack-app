import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  Animated, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, Easing, StatusBar
} from 'react-native';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

const COLORS = {
  navy:        '#0A1628',
  blue:        '#1A3C6E',
  accent:      '#2E86DE',
  light:       '#4FC3F7',
  white:       '#FFFFFF',
  glass:       'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  inputBg:     'rgba(255,255,255,0.06)',
  textMuted:   'rgba(255,255,255,0.55)',
  green:       '#26D07C',
};

const ROLES = [
  { key: 'passenger', label: 'Passenger', icon: '👤' },
  { key: 'driver',    label: 'Driver',    icon: '🚗' },
];

export default function LoginScreen({ navigation }) {
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [role,          setRole]          = useState('passenger');
  const [loading,       setLoading]       = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [focusedInput,  setFocusedInput]  = useState(null);

  // ── Animations ──
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(50)).current;
  const logoScale   = useRef(new Animated.Value(0.4)).current;
  const bounceAnim  = useRef(new Animated.Value(0)).current;
  const ring1Scale  = useRef(new Animated.Value(1)).current;
  const ring1Opacity= useRef(new Animated.Value(0.6)).current;
  const ring2Scale  = useRef(new Animated.Value(1)).current;
  const ring2Opacity= useRef(new Animated.Value(0.4)).current;
  const ring3Scale  = useRef(new Animated.Value(1)).current;
  const ring3Opacity= useRef(new Animated.Value(0.2)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;
  const cardPop     = useRef(new Animated.Value(1)).current;
  const passwordRef = useRef(null);

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 45, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 35, friction: 5, useNativeDriver: true }),
    ]).start(() => {
      // Logo float
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -10, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0,   duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });

    // Pulse ring 1
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring1Scale,   { toValue: 1.45, duration: 1600, useNativeDriver: true }),
          Animated.timing(ring1Scale,   { toValue: 1,    duration: 1600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring1Opacity, { toValue: 0,   duration: 1600, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0.6, duration: 1600, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Pulse ring 2 — delayed
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring2Scale,   { toValue: 1.7, duration: 2000, useNativeDriver: true }),
            Animated.timing(ring2Scale,   { toValue: 1,   duration: 2000, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring2Opacity, { toValue: 0,   duration: 2000, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, 400);

    // Pulse ring 3 — more delayed
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring3Scale,   { toValue: 2.0, duration: 2400, useNativeDriver: true }),
            Animated.timing(ring3Scale,   { toValue: 1,   duration: 2400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring3Opacity, { toValue: 0,   duration: 2400, useNativeDriver: true }),
            Animated.timing(ring3Opacity, { toValue: 0.2, duration: 2400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, 800);
  }, []);

  const handleRoleChange = (r) => {
    setRole(r);
    Animated.sequence([
      Animated.timing(cardPop, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(cardPop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/auth/${role}/login`, {
        email: email.trim().toLowerCase(),
        password,
      });
      const { token, user } = response.data;
      global.userToken = token;
      global.userInfo  = user;

      if (user.role === 'passenger') navigation.replace('PassengerApp');
      else if (user.role === 'driver') navigation.replace('DriverApp');
      else if (user.role === 'admin')  navigation.replace('AdminApp');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── LOGO SECTION ── */}
        <Animated.View style={[
          styles.logoSection,
          { opacity: fadeAnim, transform: [{ scale: logoScale }] }
        ]}>
          {/* Pulse Rings */}
          <Animated.View style={[
            styles.ring, styles.ring3,
            { transform: [{ scale: ring3Scale }], opacity: ring3Opacity }
          ]} />
          <Animated.View style={[
            styles.ring, styles.ring2,
            { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }
          ]} />
          <Animated.View style={[
            styles.ring, styles.ring1,
            { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }
          ]} />

          {/* Logo box with float */}
          <Animated.View style={[
            styles.logoBox,
            { transform: [{ translateY: bounceAnim }] }
          ]}>
            <Text style={styles.logoEmoji}>🚗</Text>
          </Animated.View>

          <Text style={styles.appName}>
            <Text style={styles.nexText}>Nex</Text>
            <Text style={styles.rideText}>Ride</Text>
          </Text>
          <Text style={styles.tagline}>AI-Driven Vehicle Rental</Text>
        </Animated.View>

        {/* ── FORM CARD ── */}
        <Animated.View style={[
          styles.card,
          {
            opacity:   fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: cardPop }],
          }
        ]}>

          {/* Role tabs */}
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                onPress={() => handleRoleChange(r.key)}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.welcomeText}>
            {'Welcome back, '}
            <Text style={{ color: COLORS.light }}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </Text>

          {/* Email */}
          <View style={[
            styles.inputWrapper,
            focusedInput === 'email' && styles.inputWrapperFocused
          ]}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={[
            styles.inputWrapper,
            focusedInput === 'password' && styles.inputWrapperFocused
          ]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              onPressIn={() =>
                Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start()
              }
              onPressOut={() =>
                Animated.spring(btnScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()
              }
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.loginBtnTxt}>Sign In </Text>
              }
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up button */}
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.signupBtnTxt}>Create New Account ✨</Text>
          </TouchableOpacity>

        </Animated.View>

        {/* Bottom branding */}
        <View style={styles.bottomBrand}>
          <Text style={styles.bottomBrandTxt}>GC University Faisalabad · FYP 2025–26</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const LOGO_SIZE  = 100;
const RING1_SIZE = 140;
const RING2_SIZE = 185;
const RING3_SIZE = 230;

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: COLORS.navy },
  blob1:      { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(46,134,222,0.12)', top: -100, right: -80 },
  blob2:      { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(79,195,247,0.07)', bottom: 80, left: -60 },
  blob3:      { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(26,60,110,0.5)', top: height * 0.35, right: -40 },
  scroll:     { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  // Logo section
  logoSection:{ alignItems: 'center', marginBottom: 44, position: 'relative', height: RING3_SIZE },

  // Rings
  ring:       { position: 'absolute', borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(46,134,222,0.7)' },
  ring1:      { width: RING1_SIZE, height: RING1_SIZE, top: (RING3_SIZE - RING1_SIZE) / 2, left: (width - 48 - RING1_SIZE) / 2 },
  ring2:      { width: RING2_SIZE, height: RING2_SIZE, top: (RING3_SIZE - RING2_SIZE) / 2, left: (width - 48 - RING2_SIZE) / 2 },
  ring3:      { width: RING3_SIZE, height: RING3_SIZE, top: 0, left: (width - 48 - RING3_SIZE) / 2 },

  // Logo box
  logoBox:    {
    position:        'absolute',
    width:           LOGO_SIZE,
    height:          LOGO_SIZE,
    borderRadius:    28,           // ← attractive rounded square
    backgroundColor: 'rgba(46,134,222,0.18)',
    borderWidth:     2,
    borderColor:     'rgba(46,134,222,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
    top:             (RING3_SIZE - LOGO_SIZE) / 2,
    left:            (width - 48 - LOGO_SIZE) / 2,
    shadowColor:     '#2E86DE',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.7,
    shadowRadius:    20,
    elevation:       20,
  },
  logoEmoji:  { fontSize: 48 },
  appName:    { position: 'absolute', bottom: 22, fontSize: 30, fontWeight: '900', letterSpacing: 2 },
  nexText:    { color: COLORS.white },
  rideText:   { color: COLORS.accent },
  tagline:    { position: 'absolute', bottom: 0, fontSize: 11, color: COLORS.textMuted, letterSpacing: 3, textTransform: 'uppercase' },

  // Card
  card:         { backgroundColor: COLORS.glass, borderRadius: 26, borderWidth: 1, borderColor: COLORS.glassBorder, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 12 },

  // Roles
  roleRow:      { flexDirection: 'row', gap: 10, marginBottom: 22 },
  roleBtn:      { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.inputBg },
  roleBtnActive:{ backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  roleIcon:     { fontSize: 20, marginBottom: 3 },
  roleLabel:    { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  roleLabelActive: { color: COLORS.white },

  welcomeText:  { fontSize: 19, fontWeight: '700', color: COLORS.white, marginBottom: 20 },

  // Input
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 15, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 14, marginBottom: 14, height: 56 },
  inputWrapperFocused: { borderColor: COLORS.accent, backgroundColor: 'rgba(46,134,222,0.08)' },
  inputIcon:    { fontSize: 16, marginRight: 10 },
  input:        { flex: 1, color: COLORS.white, fontSize: 15 },
  eyeBtn:       { padding: 6 },
  eyeIcon:      { fontSize: 18 },

  // Login btn
  loginBtn:     { backgroundColor: COLORS.accent, borderRadius: 15, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  loginBtnTxt:  { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  // Divider
  dividerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: COLORS.glassBorder },
  dividerTxt:   { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },

  // Signup btn
  signupBtn:    { borderWidth: 1.5, borderColor: COLORS.accent, borderRadius: 15, height: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(46,134,222,0.08)' },
  signupBtnTxt: { color: COLORS.light, fontSize: 15, fontWeight: '700' },

  // Bottom
  bottomBrand:    { alignItems: 'center', marginTop: 28 },
  bottomBrandTxt: { color: 'rgba(255,255,255,0.2)', fontSize: 11 },
});