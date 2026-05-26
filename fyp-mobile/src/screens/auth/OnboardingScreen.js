import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  TouchableOpacity, FlatList, StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  navy:        '#0A1628',
  blue:        '#1A3C6E',
  accent:      '#2E86DE',
  light:       '#4FC3F7',
  white:       '#FFFFFF',
  green:       '#26D07C',
  glass:       'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.12)',
  muted:       'rgba(255,255,255,0.5)',
};

const SLIDES = [
  {
    id:      '1',
    emoji:   '🚗',
    title:   'Book Any Vehicle',
    sub:     'Instantly',
    desc:    'Choose from cars, SUVs, vans and more. Book with a driver or drive yourself — your choice, your comfort.',
    accent:  '#2E86DE',
    bg1:     'rgba(46,134,222,0.15)',
    bg2:     'rgba(46,134,222,0.06)',
    features: ['Cars, SUVs & Vans', 'With or Without Driver', 'Instant Confirmation'],
  },
  {
    id:      '2',
    emoji:   '📍',
    title:   'Track in',
    sub:     'Real Time',
    desc:    'Know exactly where your driver is. Live GPS tracking with route visualization — always stay informed.',
    accent:  '#26D07C',
    bg1:     'rgba(38,208,124,0.15)',
    bg2:     'rgba(38,208,124,0.06)',
    features: ['Live GPS Tracking', 'Driver Location Updates', 'Route on Map'],
  },
  {
    id:      '3',
    emoji:   '🤖',
    title:   'AI-Powered',
    sub:     'Smart Pricing',
    desc:    'Our AI recommends the best vehicle for you and calculates accurate fares based on distance and time.',
    accent:  '#4FC3F7',
    bg1:     'rgba(79,195,247,0.15)',
    bg2:     'rgba(79,195,247,0.06)',
    features: ['AI Recommendations', 'Distance-Based Fares', 'Transparent Pricing'],
  },
  {
    id:      '4',
    emoji:   '💳',
    title:   'Pay Securely,',
    sub:     'Get Receipt',
    desc:    'Multiple payment gateways available. Every booking generates a detailed digital receipt instantly.',
    accent:  '#FF9500',
    bg1:     'rgba(255,149,0,0.15)',
    bg2:     'rgba(255,149,0,0.06)',
    features: ['6 Payment Methods', 'Instant Digital Receipt', '5% GST Included'],
  },
];

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef    = useRef(null);
  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  const animateTransition = (nextIndex) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setActiveIndex(nextIndex);
      flatRef.current?.scrollToIndex({ index: nextIndex, animated: false });
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      animateTransition(activeIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => navigation.replace('Login');

  const current = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Dynamic background blobs */}
      <Animated.View style={[
        styles.blob1,
        { backgroundColor: current.bg1 }
      ]} />
      <Animated.View style={[
        styles.blob2,
        { backgroundColor: current.bg2 }
      ]} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoSmall}>
          <Text style={styles.logoSmallText}>🚗 NexRide</Text>
        </View>
        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipTxt}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main content */}
      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        {/* Icon card */}
        <View style={[styles.iconCard, { borderColor: current.accent + '40' }]}>
          <View style={[styles.iconBg, { backgroundColor: current.accent + '20' }]}>
            <Text style={styles.emoji}>{current.emoji}</Text>
          </View>
          {/* Decorative rings */}
          <View style={[styles.iconRing1, { borderColor: current.accent + '30' }]} />
          <View style={[styles.iconRing2, { borderColor: current.accent + '15' }]} />
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleMain}>{current.title}</Text>
          <Text style={[styles.titleAccent, { color: current.accent }]}>
            {current.sub}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.desc}>{current.desc}</Text>

        {/* Feature pills */}
        <View style={styles.pillsRow}>
          {current.features.map((f, i) => (
            <View key={i} style={[styles.pill, { borderColor: current.accent + '40' }]}>
              <View style={[styles.pillDot, { backgroundColor: current.accent }]} />
              <Text style={styles.pillText}>{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => animateTransition(i)}
            >
              <Animated.View style={[
                styles.dot,
                i === activeIndex && [
                  styles.dotActive,
                  { backgroundColor: current.accent }
                ]
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          {activeIndex > 0 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => animateTransition(activeIndex - 1)}
            >
              <Text style={styles.backTxt}>← Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextBtn,
              { backgroundColor: current.accent },
              activeIndex === 0 && { flex: 1 }
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextTxt}>
              {activeIndex === SLIDES.length - 1 ? '🚀 Get Started' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Already have account */}
        {activeIndex === SLIDES.length - 1 && (
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.loginLinkTxt}>
              Already have an account?{' '}
              <Text style={[styles.loginLinkBold, { color: current.accent }]}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Step counter */}
      <View style={styles.stepCounter}>
        <Text style={styles.stepTxt}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },

  // Background blobs
  blob1: {
    position: 'absolute', top: -120, right: -80,
    width: 400, height: 400, borderRadius: 200,
  },
  blob2: {
    position: 'absolute', bottom: -100, left: -80,
    width: 350, height: 350, borderRadius: 175,
  },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24,
    paddingTop: 56, paddingBottom: 16,
  },
  logoSmall: {
    backgroundColor: COLORS.glass,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  logoSmallText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  skipBtn: {
    backgroundColor: COLORS.glass,
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  skipTxt: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },

  // Content
  content: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: 28, paddingTop: 20,
  },

  // Icon card
  iconCard: {
    width: 160, height: 160, alignItems: 'center',
    justifyContent: 'center', marginBottom: 36,
    position: 'relative',
  },
  iconBg: {
    width: 120, height: 120, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 16,
  },
  emoji: { fontSize: 58 },
  iconRing1: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, borderWidth: 1,
  },
  iconRing2: {
    position: 'absolute', width: 165, height: 165,
    borderRadius: 82, borderWidth: 1,
  },

  // Title
  titleBlock: { alignItems: 'center', marginBottom: 16 },
  titleMain: {
    fontSize: 36, fontWeight: '900', color: COLORS.white,
    letterSpacing: -0.5, textAlign: 'center',
  },
  titleAccent: {
    fontSize: 36, fontWeight: '900',
    letterSpacing: -0.5, textAlign: 'center',
    marginTop: -6,
  },

  // Description
  desc: {
    fontSize: 15, color: COLORS.muted, textAlign: 'center',
    lineHeight: 24, marginBottom: 28, paddingHorizontal: 8,
    fontWeight: '400',
  },

  // Feature pills
  pillsRow: { gap: 10, alignItems: 'flex-start', width: '100%' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, width: '100%',
  },
  pillDot:  { width: 7, height: 7, borderRadius: 3.5 },
  pillText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },

  // Bottom
  bottom: {
    paddingHorizontal: 24, paddingBottom: 40,
  },

  // Dots
  dotsRow:  { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 5 },
  dot:      { width: 8, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive:{ width: 28, height: 8, borderRadius: 4 },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  backBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  backTxt: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  nextBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  nextTxt: { color: COLORS.white, fontWeight: '800', fontSize: 16 },

  // Login link
  loginLink:     { alignItems: 'center', paddingTop: 4 },
  loginLinkTxt:  { color: COLORS.muted, fontSize: 14 },
  loginLinkBold: { fontWeight: '800' },

  // Step counter
  stepCounter: {
    position: 'absolute', top: 62, right: 24,
  },
  stepTxt: {
    color: COLORS.muted, fontSize: 12,
    fontWeight: '700', letterSpacing: 1,
  },
});