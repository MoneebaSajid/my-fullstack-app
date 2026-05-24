import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, TextInput,
  StatusBar, Dimensions
} from 'react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

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
  danger: '#FF4D4D',
};

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    nationality: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/passengers/profile');
      setProfile(response.data.passenger);
      setForm({
        name: response.data.passenger.name,
        phone: response.data.passenger.phone,
        address: response.data.passenger.address || '',
        nationality: response.data.passenger.nationality || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not load profile!');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.name || !form.phone) {
      Alert.alert('Error', 'Name and phone are required!');
      return;
    }

    setUpdating(true);
    try {
      await api.put('/passengers/profile', form);
      Alert.alert('Success', '✅ Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      Alert.alert('Error', 'Could not update profile!');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            global.userToken = null;
            global.userInfo = null;
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingTxt}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {profile?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          
          <View style={styles.loyaltyBadge}>
            <Text style={styles.loyaltyTxt}>
              🏆 {profile?.loyalty_points || 0} Points
            </Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <TouchableOpacity
              style={[styles.editBtn, editing && { backgroundColor: 'rgba(255, 77, 77, 0.1)' }]}
              onPress={() => setEditing(!editing)}
            >
              <Text style={[styles.editTxt, editing && { color: COLORS.danger }]}>
                {editing ? 'Cancel' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(val) => setForm({ ...form, name: val })}
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(val) => setForm({ ...form, phone: val })}
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={(val) => setForm({ ...form, address: val })}
              />
              <TouchableOpacity
                style={styles.updateBtn}
                onPress={handleUpdate}
                disabled={updating}
              >
                {updating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.updateTxt}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>📱 Phone</Text><Text style={styles.infoValue}>{profile?.phone}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>📍 Address</Text><Text style={styles.infoValue} numberOfLines={1}>{profile?.address || 'Not set'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>🌍 Nationality</Text><Text style={styles.infoValue}>{profile?.nationality || 'Not set'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>✅ Status</Text><Text style={[styles.infoValue, { color: COLORS.green }]}>{profile?.status || 'Active'}</Text></View>
            </View>
          )}
        </View>

        {/* Quick Actions - Updated Styling */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('MyBookings')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTxt}>My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AIRecommend')}
          >
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionTxt}>AI Recommendations</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.navy },
  center: { flex: 1, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  loadingTxt: { color: COLORS.textMuted, marginTop: 10 },
  circle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(46,134,222,0.1)', top: -50, right: -50 },
  circle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(79,195,247,0.05)', bottom: 50, left: -40 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  headerCard: { backgroundColor: COLORS.glass, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)' },
  avatarTxt: { fontSize: 38, fontWeight: '800', color: COLORS.white },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  email: { fontSize: 14, color: COLORS.textMuted, marginBottom: 15 },
  loyaltyBadge: { backgroundColor: 'rgba(46, 134, 222, 0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(46, 134, 222, 0.3)' },
  loyaltyTxt: { color: COLORS.light, fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: COLORS.glass, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 1 },
  editBtn: { backgroundColor: 'rgba(46, 134, 222, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editTxt: { color: COLORS.accent, fontWeight: '700', fontSize: 12 },
  infoList: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { fontSize: 14, color: COLORS.textMuted },
  infoValue: { fontSize: 14, color: COLORS.white, fontWeight: '600' },
  form: { gap: 12 },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: -8, marginLeft: 4 },
  input: { backgroundColor: COLORS.inputBg, padding: 14, borderRadius: 14, color: COLORS.white, fontSize: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
  updateBtn: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  updateTxt: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46, 134, 222, 0.15)', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(46, 134, 222, 0.3)' },
  actionIcon: { fontSize: 18, marginRight: 12 },
  actionTxt: { fontSize: 15, color: COLORS.accent, fontWeight: '700' },
  logoutBtn: { backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.2)', marginTop: 10, marginBottom: 30 },
  logoutTxt: { color: COLORS.danger, fontSize: 16, fontWeight: '700' },
});