import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'admin'
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('adminToken')) navigate('/');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/admin/login', { email, password });
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminInfo', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.phone) {
      setRegisterError('Please fill all fields.');
      return;
    }
    setRegisterLoading(true);
    setRegisterError('');
    setRegisterSuccess('');
    try {
      await api.post('/auth/admin/register', registerForm);
      setRegisterSuccess('✅ Account created! Please login.');
      setActiveTab('login');
      setEmail(registerForm.email);
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.circle1} />
      <div style={styles.circle2} />
      <div style={styles.circle3} />

      <div style={styles.container}>

        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🚗</div>
          <h1 style={styles.appName}>
            Nex<span style={{ color: '#4FC3F7' }}>Ride</span>
          </h1>
          <p style={styles.tagline}>ADMIN CONTROL PANEL</p>
        </div>

        {/* Card */}
        <div style={styles.card}>

          {/* Tabs */}
          <div style={styles.tabRow}>
            {['login', 'register'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(''); setRegisterError(''); setRegisterSuccess(''); }}
                style={{
                  ...styles.tab,
                  background: activeTab === tab ? 'rgba(46,134,222,0.2)' : 'transparent',
                  color: activeTab === tab ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                  borderBottom: activeTab === tab ? '2px solid #2E86DE' : '2px solid transparent',
                }}
              >
                {tab === 'login' ? '🔐 Sign In' : '📝 Sign Up'}
              </button>
            ))}
          </div>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <>
              <h2 style={styles.cardTitle}>Welcome Back 👑</h2>
              <p style={styles.cardSubtitle}>Sign in to your admin account</p>

              {error && <div style={styles.errorBox}><span>⚠️</span> {error}</div>}
              {registerSuccess && <div style={styles.successBox}><span>✅</span> {registerSuccess}</div>}

              <form onSubmit={handleLogin}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>✉️</span>
                    <input
                      type="email"
                      style={styles.input}
                      placeholder="admin@nexride.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                  disabled={loading}
                >
                  {loading ? '⟳ Signing in...' : 'Sign In →'}
                </button>
              </form>

              <p style={styles.switchTxt}>
                Don't have an account?{' '}
                <span style={styles.switchLink} onClick={() => setActiveTab('register')}>
                  Sign Up here
                </span>
              </p>
            </>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <>
              <h2 style={styles.cardTitle}>Create Account 📝</h2>
              <p style={styles.cardSubtitle}>Register a new admin account</p>

              {registerError && <div style={styles.errorBox}><span>⚠️</span> {registerError}</div>}

              <form onSubmit={handleRegister}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>👤</span>
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="Admin Name"
                      value={registerForm.name}
                      onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>✉️</span>
                    <input
                      type="email"
                      style={styles.input}
                      placeholder="admin@nexride.com"
                      value={registerForm.email}
                      onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>📱</span>
                    <input
                      type="tel"
                      style={styles.input}
                      placeholder="03001234567"
                      value={registerForm.phone}
                      onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input
                      type="password"
                      style={styles.input}
                      placeholder="Create a strong password"
                      value={registerForm.password}
                      onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Admin Role</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>👑</span>
                    <select
                      style={{ ...styles.input, cursor: 'pointer' }}
                      value={registerForm.role}
                      onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}
                    >
                      <option value="admin" style={{ background: '#0D1F3C' }}>Admin</option>
                      <option value="super_admin" style={{ background: '#0D1F3C' }}>Super Admin</option>
                      <option value="manager" style={{ background: '#0D1F3C' }}>Manager</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ ...styles.submitBtn, opacity: registerLoading ? 0.7 : 1 }}
                  disabled={registerLoading}
                >
                  {registerLoading ? '⟳ Creating account...' : 'Create Account →'}
                </button>
              </form>

              <p style={styles.switchTxt}>
                Already have an account?{' '}
                <span style={styles.switchLink} onClick={() => setActiveTab('login')}>
                  Sign In here
                </span>
              </p>
            </>
          )}

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <span style={styles.statNum}>20+</span>
              <span style={styles.statLabel}>Vehicles</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statNum}>4</span>
              <span style={styles.statLabel}>AI Features</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statNum}>100%</span>
              <span style={styles.statLabel}>Secure</span>
            </div>
          </div>
        </div>

        <p style={styles.footer}>NexRide © 2025 — AI-Driven Vehicle Rental System</p>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#0A1628',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(46,134,222,0.08)', top: -150, right: -150 },
  circle2: { position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'rgba(79,195,247,0.06)', bottom: -100, left: -100 },
  circle3: { position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(26,60,110,0.5)', top: '40%', right: '15%' },
  container: { width: '100%', maxWidth: 440, padding: '0 20px', position: 'relative', zIndex: 1 },
  logoSection: { textAlign: 'center', marginBottom: 28 },
  logoIcon: { fontSize: 48, marginBottom: 8 },
  appName: { fontSize: 34, fontWeight: 800, color: '#FFFFFF', letterSpacing: 2, margin: 0 },
  tagline: { fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, marginTop: 6 },
  card: {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '28px 32px',
    backdropFilter: 'blur(20px)',
  },
  tabRow: {
    display: 'flex',
    marginBottom: 24,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    padding: '10px 0',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  cardTitle: { fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px 0' },
  cardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px 0' },
  errorBox: {
    background: 'rgba(255,71,87,0.1)',
    border: '1px solid rgba(255,71,87,0.3)',
    borderRadius: 10, padding: '10px 14px',
    color: '#FF4757', fontSize: 13, marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  successBox: {
    background: 'rgba(38,208,124,0.1)',
    border: '1px solid rgba(38,208,124,0.3)',
    borderRadius: 10, padding: '10px 14px',
    color: '#26D07C', fontSize: 13, marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  inputGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrapper: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0 14px', height: 48 },
  inputIcon: { fontSize: 15, marginRight: 10 },
  input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', fontSize: 14, height: '100%' },
  eyeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 },
  submitBtn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #2E86DE, #4FC3F7)',
    border: 'none', borderRadius: 12,
    color: '#FFFFFF', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 4, letterSpacing: 0.5,
  },
  switchTxt: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 16 },
  switchLink: { color: '#4FC3F7', cursor: 'pointer', fontWeight: 600 },
  statsRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', gap: 20 },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  statNum: { fontSize: 16, fontWeight: 700, color: '#4FC3F7' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  statDivider: { width: 1, height: 28, background: 'rgba(255,255,255,0.1)' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 20 },
};