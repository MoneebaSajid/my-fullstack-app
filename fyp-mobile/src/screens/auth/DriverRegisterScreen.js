import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_URL } from '../../services/api';

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepBar = ({ current, total }) => (
  <View style={styles.stepBar}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.step,
          i < current && styles.stepDone,
          i === current && styles.stepActive,
        ]}
      />
    ))}
  </View>
);

// ─── Upload button ────────────────────────────────────────────────────────────
const UploadBox = ({ label, uri, onPress }) => (
  <TouchableOpacity style={styles.uploadBox} onPress={onPress} activeOpacity={0.7}>
    {uri ? (
      <Image source={{ uri }} style={styles.uploadPreview} resizeMode="cover" />
    ) : (
      <>
        <Text style={styles.uploadIcon}>📎</Text>
        <Text style={styles.uploadLabel}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function DriverRegisterScreen({ navigation }) {
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0 — Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [gender, setGender]       = useState('Male');
  const [dob, setDob]             = useState(new Date(1995, 0, 1));
  const [showDob, setShowDob]     = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Step 1 — License & CNIC
  const [licenseNumber, setLicenseNumber]   = useState('');
  const [licenseExpiry, setLicenseExpiry]   = useState(new Date());
  const [showExpiry, setShowExpiry]         = useState(false);
  const [cnicNumber, setCnicNumber]         = useState('');
  const [cnicFront, setCnicFront]           = useState(null);
  const [cnicBack, setCnicBack]             = useState(null);
  const [licensePhoto, setLicensePhoto]     = useState(null);

  // Step 2 — Vehicle info (optional at registration)
  const [vehicleModel, setVehicleModel]     = useState('');
  const [vehiclePlate, setVehiclePlate]     = useState('');
  const [vehicleYear, setVehicleYear]       = useState('');
  const [vehicleColor, setVehicleColor]     = useState('');

  // ─── Image picker helper ───────────────────────────────────────────────────
  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow media access to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim())
        return 'Please enter your full name.';
      if (!phone.trim() || phone.length < 10)
        return 'Please enter a valid phone number.';
      if (!email.includes('@'))
        return 'Please enter a valid email address.';
      if (password.length < 6)
        return 'Password must be at least 6 characters.';
    }
    if (step === 1) {
      if (!licenseNumber.trim())
        return 'Please enter your license number.';
      if (!cnicNumber.trim() || cnicNumber.length < 13)
        return 'Please enter a valid CNIC number (13 digits).';
      if (!cnicFront || !cnicBack)
        return 'Please upload both sides of your CNIC.';
      if (!licensePhoto)
        return 'Please upload a photo of your driving license.';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) { Alert.alert('Missing info', error); return; }
    if (step < TOTAL_STEPS - 1) { setStep(step + 1); }
    else { handleSubmit(); }
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Personal
      formData.append('first_name', firstName.trim());
      formData.append('last_name',  lastName.trim());
      formData.append('phone',      phone.trim());
      formData.append('email',      email.trim().toLowerCase());
      formData.append('password',   password);
      formData.append('gender',     gender);
      formData.append('dob',        dob.toISOString().split('T')[0]);

      // License & CNIC
      formData.append('license_number', licenseNumber.trim());
      formData.append('license_expiry', licenseExpiry.toISOString().split('T')[0]);
      formData.append('cnic_number',    cnicNumber.trim());

      // Vehicle (optional)
      if (vehicleModel)  formData.append('vehicle_model', vehicleModel.trim());
      if (vehiclePlate)  formData.append('vehicle_plate', vehiclePlate.trim());
      if (vehicleYear)   formData.append('vehicle_year',  vehicleYear.trim());
      if (vehicleColor)  formData.append('vehicle_color', vehicleColor.trim());

      // Files
      const appendFile = (key, uri) => {
        if (!uri) return;
        const filename = uri.split('/').pop();
        const ext = filename.split('.').pop().toLowerCase();
        const type = ext === 'png' ? 'image/png' : 'image/jpeg';
        formData.append(key, { uri, name: filename, type });
      };

      appendFile('profile_photo', profilePhoto);
      appendFile('cnic_front',    cnicFront);
      appendFile('cnic_back',     cnicBack);
      appendFile('license_photo', licensePhoto);

      const response = await axios.post(
        `${API_URL}/auth/driver/register`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      Alert.alert(
        'Registration submitted!',
        'Your account is under review. You will be notified once approved.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Registration failed. Please check your details and try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Date formatter ────────────────────────────────────────────────────────
  const formatDate = (d) =>
    d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });

  // ─── Render steps ──────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <>
      {/* Profile photo */}
      <TouchableOpacity
        style={styles.avatarWrap}
        onPress={() => pickImage(setProfilePhoto)}
        activeOpacity={0.8}
      >
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarPlaceholder}>📷{'\n'}Photo</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Personal information</Text>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ali"
            autoCapitalize="words"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Last name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Hassan"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+92 300 1234567"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="driver@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Min. 6 characters"
          secureTextEntry
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Date of birth</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDob(true)}>
            <Text style={styles.inputText}>{formatDate(dob)}</Text>
          </TouchableOpacity>
          {showDob && (
            <DateTimePicker
              value={dob}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, d) => { setShowDob(false); if (d) setDob(d); }}
            />
          )}
        </View>

        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.input}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                style={[
                  styles.genderBtn,
                  gender === g && styles.genderBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === g && styles.genderTextActive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.sectionLabel}>License details</Text>

      <View style={styles.field}>
        <Text style={styles.label}>License number</Text>
        <TextInput
          style={styles.input}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="PB-DL-12345678"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>License expiry date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowExpiry(true)}>
          <Text style={styles.inputText}>{formatDate(licenseExpiry)}</Text>
        </TouchableOpacity>
        {showExpiry && (
          <DateTimePicker
            value={licenseExpiry}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, d) => { setShowExpiry(false); if (d) setLicenseExpiry(d); }}
          />
        )}
      </View>

      <Text style={styles.sectionLabel}>CNIC details</Text>

      <View style={styles.field}>
        <Text style={styles.label}>CNIC number (without dashes)</Text>
        <TextInput
          style={styles.input}
          value={cnicNumber}
          onChangeText={setCnicNumber}
          placeholder="3520112345671"
          keyboardType="numeric"
          maxLength={13}
        />
      </View>

      <Text style={styles.sectionLabel}>Document uploads</Text>

      <View style={styles.row}>
        <UploadBox
          label="CNIC front"
          uri={cnicFront}
          onPress={() => pickImage(setCnicFront)}
        />
        <UploadBox
          label="CNIC back"
          uri={cnicBack}
          onPress={() => pickImage(setCnicBack)}
        />
      </View>

      <UploadBox
        label="Driver's license photo"
        uri={licensePhoto}
        onPress={() => pickImage(setLicensePhoto)}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.sectionLabel}>Vehicle info (optional)</Text>
      <Text style={styles.hint}>
        You can add your vehicle later from the app. Fill in now to speed up approval.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Vehicle model</Text>
        <TextInput
          style={styles.input}
          value={vehicleModel}
          onChangeText={setVehicleModel}
          placeholder="e.g. Toyota Corolla"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Plate number</Text>
          <TextInput
            style={styles.input}
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            placeholder="LHR-1234"
            autoCapitalize="characters"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            value={vehicleYear}
            onChangeText={setVehicleYear}
            placeholder="2020"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Color</Text>
        <TextInput
          style={styles.input}
          value={vehicleColor}
          onChangeText={setVehicleColor}
          placeholder="White"
          autoCapitalize="words"
        />
      </View>
    </>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Registration</Text>
        <Text style={styles.headerSub}>Create your NexRide driver account</Text>
      </View>

      <StepBar current={step} total={TOTAL_STEPS} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}

        {/* Navigation buttons */}
        <View style={styles.btnRow}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, step > 0 && { flex: 1 }]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextBtnText}>
                {step < TOTAL_STEPS - 1 ? 'Continue →' : 'Submit Registration'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>
            Already registered?{' '}
            <Text style={styles.loginLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const DARK = '#1a1a2e';
const ACCENT = '#5c5cd6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f8' },

  header: {
    backgroundColor: DARK,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '600' },
  headerSub:   { color: '#9999bb', fontSize: 13, marginTop: 4 },

  stepBar: { flexDirection: 'row', gap: 6, padding: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  step:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0' },
  stepDone:   { backgroundColor: DARK },
  stepActive: { backgroundColor: ACCENT },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  hint: { fontSize: 12, color: '#aaa', marginBottom: 12, lineHeight: 18 },

  row:   { flexDirection: 'row', gap: 10 },
  field: { marginBottom: 12 },

  label: { fontSize: 12, color: '#555', marginBottom: 4 },

  input: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: { fontSize: 14, color: '#333' },

  genderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
    backgroundColor: '#f0f0f0',
  },
  genderBtnActive: { backgroundColor: ACCENT },
  genderText:      { fontSize: 11, color: '#555' },
  genderTextActive:{ color: '#fff' },

  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8e8f5',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9999cc',
    alignSelf: 'center',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar:            { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { textAlign: 'center', fontSize: 11, color: '#9999cc', lineHeight: 18 },

  uploadBox: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#99aacc',
    borderRadius: 10,
    backgroundColor: '#eef0fb',
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 70,
    justifyContent: 'center',
  },
  uploadIcon:    { fontSize: 22, marginBottom: 4 },
  uploadLabel:   { fontSize: 11, color: '#5566bb', textAlign: 'center' },
  uploadPreview: { width: '100%', height: 80, borderRadius: 8 },

  btnRow:  { flexDirection: 'row', gap: 10, marginTop: 20 },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  backBtnText: { color: '#555', fontSize: 14, fontWeight: '500' },

  nextBtn: {
    flex: 2,
    backgroundColor: DARK,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  loginLink:     { textAlign: 'center', fontSize: 12, color: '#999', marginTop: 16 },
  loginLinkBold: { color: ACCENT, fontWeight: '600' },
});