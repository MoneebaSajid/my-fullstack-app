import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  Animated, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, Easing
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
};

const ROLES = [
  { key: 'passenger', label: 'Passenger', icon: '👤' },
  { key: 'driver', label: 'Driver', icon: '🚗' },
];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('passenger');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // ── Animation Values ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current; // Logo floating
  const cardPopAnim = useRef(new Animated.Value(1)).current; // Role selection pop
  const btnScaleAnim = useRef(new Animated.Value(1)).current; // Login button squish
  const passwordRef = useRef(null);

  useEffect(() => {
    // 1. Initial Entrance Animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }),
    ]).start(() => {
      // 2. Continuous Logo Bounce
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { 
            toValue: -12, 
            duration: 1200, 
            easing: Easing.inOut(Easing.ease), 
            useNativeDriver: true 
          }),
          Animated.timing(bounceAnim, { 
            toValue: 0, 
            duration: 1200, 
            easing: Easing.inOut(Easing.ease), 
            useNativeDriver: true 
          })
        ])
      ).start();
    });
  }, []);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    Animated.sequence([
      Animated.timing(cardPopAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(cardPopAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true })
    ]).start();
  };

  const handlePressIn = () => {
    Animated.spring(btnScaleAnim, { toValue: 0.94, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(btnScaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/auth/${role}/login`, { email: email.trim(), password });
      const { token, user } = response.data;
      global.userToken = token;
      global.userInfo = user;

      if (user.role === 'passenger') navigation.replace('PassengerApp');
      else if (user.role === 'driver') navigation.replace('DriverApp');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.circle1} /><View style={styles.circle2} /><View style={styles.circle3} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Logo Section with Bounce */}
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
          <Animated.Image
            source={require('../../../assets/logo.png')}
            style={[styles.logo, { transform: [{ translateY: bounceAnim }] }]}
            resizeMode="contain"
          />
          <Text style={styles.appName}>NexRide</Text>
          <Text style={styles.tagline}>Smart Vehicle Rental</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: cardPopAnim }] }]}>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                onPress={() => handleRoleChange(r.key)}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.welcomeText}>Welcome back, {role.charAt(0).toUpperCase() + role.slice(1)}</Text>

          <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused]}>
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
            />
          </View>

          <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused]}>
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
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.loginBtnTxt}>Sign In</Text>}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.navy },
  circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(46,134,222,0.12)', top: -80, right: -80 },
  circle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(79,195,247,0.08)', bottom: 100, left: -60 },
  circle3: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(26,60,110,0.6)', top: height * 0.3, right: -40 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 90, height: 90, marginBottom: 12 },
  appName: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: 1.5 },
  tagline: { fontSize: 13, color: COLORS.textMuted, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },
  card: { backgroundColor: COLORS.glass, borderRadius: 24, borderWidth: 1, borderColor: COLORS.glassBorder, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.inputBg },
  roleBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  roleIcon: { fontSize: 18, marginBottom: 3 },
  roleLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  roleLabelActive: { color: COLORS.white },
  welcomeText: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 14, marginBottom: 14, height: 54 },
  inputWrapperFocused: { borderColor: COLORS.accent, backgroundColor: 'rgba(255,255,255,0.08)' },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: COLORS.white, fontSize: 15 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
  loginBtn: { backgroundColor: COLORS.accent, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  loginBtnTxt: { color: COLORS.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});