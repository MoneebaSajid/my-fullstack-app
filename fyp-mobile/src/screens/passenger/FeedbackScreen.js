import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator, Alert,
  Animated, StatusBar, Dimensions
} from 'react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const COLORS = {
  navy: '#060B12',
  accent: '#3897FF',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.1)',
  inputBg: 'rgba(255,255,255,0.07)',
  textMuted: '#8E9AAF',
  starActive: '#FFD700',
  card: 'rgba(255,255,255,0.03)',
};

export default function FeedbackScreen({ route, navigation }) {
  const { booking_id, booking_type, driver_id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('trip');
  const [comments, setComments] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const feedbackTypes = [
    { key: 'trip', label: '🚗 Trip' },
    { key: 'driver', label: '👨‍✈️ Driver' },
    { key: 'vehicle', label: '🚙 Vehicle' },
    { key: 'app', label: '📱 App' },
  ];

  const ratingLabels = ['', '😞 Poor', '😐 Fair', '🙂 Good', '😊 Very Good', '🤩 Excellent'];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a star rating!');
      return;
    }
    if (!comments.trim()) {
      Alert.alert('Error', 'Please write your comments!');
      return;
    }

    setLoading(true);
    try {
      await api.post('/feedback/submit', {
        booking_with_driver_id: booking_type === 'with-driver' ? booking_id : null,
        booking_without_driver_id: booking_type === 'without-driver' ? booking_id : null,
        driver_id: driver_id || null,
        rating,
        comments,
        feedback_type: feedbackType,
      });

      Alert.alert(
        '✅ Thank You!',
        'Your feedback has been submitted successfully!',
        [{ text: 'OK', onPress: () => navigation.navigate('PassengerHome') }]
      );

    } catch (error) {
      Alert.alert('Error',
        error.response?.data?.message ||
        error.message ||
        'Could not submit feedback!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Rate Your Experience</Text>
            <Text style={styles.headerSubtitle}>
              How was your journey? Your feedback helps us drive better.
            </Text>
          </View>

          {/* Star Rating Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Overall Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <Text style={[
                    styles.starTxt,
                    star <= rating && styles.starActive
                  ]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
            )}
          </View>

          {/* Feedback Type Selector */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What are you reviewing?</Text>
            <View style={styles.typeRow}>
              {feedbackTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeBtn,
                    feedbackType === type.key && styles.typeBtnActive
                  ]}
                  onPress={() => setFeedbackType(type.key)}
                >
                  <Text style={[
                    styles.typeTxt,
                    feedbackType === type.key && styles.typeTxtActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comments Input */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Write your comments</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Tell us about your experience..."
              placeholderTextColor={COLORS.textMuted}
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comments.length} / 500</Text>
          </View>

          {/* Quick Tags Chips */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Quick Tags</Text>
            <View style={styles.tagsRow}>
              {['Clean Vehicle', 'Punctual', 'Safe Driving', 'Professional'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tag}
                  onPress={() => setComments(prev =>
                    prev ? `${prev}, ${tag}` : tag
                  )}
                >
                  <Text style={styles.tagTxt}>+ {tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitTxt}>Submit Feedback</Text>
            )}
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starBtn: {
    padding: 5,
  },
  starTxt: {
    fontSize: 42,
    color: COLORS.glassBorder,
  },
  starActive: {
    color: COLORS.starActive,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
    marginTop: 12,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  typeBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(56, 151, 255, 0.15)',
  },
  typeTxt: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  typeTxtActive: {
    color: COLORS.accent,
  },
  textarea: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 15,
    fontSize: 15,
    color: COLORS.white,
    height: 120,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tagTxt: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  submitTxt: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});