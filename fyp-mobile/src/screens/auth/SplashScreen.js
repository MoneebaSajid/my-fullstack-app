import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoScale    = useRef(new Animated.Value(0)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const ring1Scale   = useRef(new Animated.Value(0)).current;
  const ring2Scale   = useRef(new Animated.Value(0)).current;
  const ring1Opacity = useRef(new Animated.Value(0.6)).current;
  const ring2Opacity = useRef(new Animated.Value(0.4)).current;
  const dotsOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rings pulse
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring1Scale,   { toValue: 1.3, duration: 1500, useNativeDriver: true }),
          Animated.timing(ring1Scale,   { toValue: 1.0, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring1Opacity, { toValue: 0.1, duration: 1500, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring2Scale,   { toValue: 1.5, duration: 2000, useNativeDriver: true }),
          Animated.timing(ring2Scale,   { toValue: 1.0, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring2Opacity, { toValue: 0.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(ring2Opacity, { toValue: 0.4,  duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Main animation sequence
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(tagOpacity,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Navigate to onboarding after 3s
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Animated rings behind logo */}
      <Animated.View style={[
        styles.ring, styles.ring1,
        { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }
      ]} />
      <Animated.View style={[
        styles.ring, styles.ring2,
        { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }
      ]} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoContainer,
        { transform: [{ scale: logoScale }], opacity: logoOpacity }
      ]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🚗</Text>
        </View>
      </Animated.View>

      {/* App Name */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>
          <Text style={styles.nexText}>Nex</Text>
          <Text style={styles.rideText}>Ride</Text>
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        AI-Driven Vehicle Rental
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>

      {/* Bottom branding */}
      <View style={styles.bottomBrand}>
        <Text style={styles.bottomText}>GC University Faisalabad</Text>
        <Text style={styles.bottomSub}>FYP 2025–2026</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Background decorations
  bgCircle1: {
    position: 'absolute', top: -100, right: -80,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(46,134,222,0.12)',
  },
  bgCircle2: {
    position: 'absolute', bottom: -80, left: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(79,195,247,0.08)',
  },
  bgCircle3: {
    position: 'absolute', top: height * 0.3, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(38,208,124,0.06)',
  },
  // Rings
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(46,134,222,0.5)',
  },
  ring1: { width: 160, height: 160 },
  ring2: { width: 220, height: 220 },
  // Logo
  logoContainer: { marginBottom: 24 },
  logoBox: {
    width: 110, height: 110, borderRadius: 32,
    backgroundColor: 'rgba(46,134,222,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(46,134,222,0.4)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E86DE', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  logoEmoji: { fontSize: 52 },
  // Text
  appName: { fontSize: 48, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  nexText:  { color: '#FFFFFF' },
  rideText: { color: '#2E86DE' },
  tagline: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3, fontWeight: '600',
    textTransform: 'uppercase', marginBottom: 40,
  },
  // Dots
  dotsRow:  { flexDirection: 'row', gap: 8 },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive:{ backgroundColor: '#2E86DE', width: 24, borderRadius: 4 },
  // Bottom
  bottomBrand: { position: 'absolute', bottom: 40, alignItems: 'center' },
  bottomText:  { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' },
  bottomSub:   { color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 2 },
});