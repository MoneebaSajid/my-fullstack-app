import React, { useState, useEffect } from 'react';
import api from '../services/api';

const COLORS = {
  navy: '#0A1628',
  accent: '#2E86DE',
  light: '#4FC3F7',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.12)',
  textMuted: 'rgba(255,255,255,0.55)',
  green: '#26D07C',
  red: '#FF4757',
  orange: '#FF9500',
};

const Badge = ({ text, color }) => (
  <span style={{
    background: `${color}20`,
    border: `1px solid ${color}40`,
    color: color,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  }}>{text}</span>
);

export default function Users() {
  const [activeTab, setActiveTab] = useState('passengers');
  const [passengers, setPassengers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [pass, driv] = await Promise.all([
        api.get('/passengers/all'),
        api.get('/drivers/all'),
      ]);
      setPassengers(pass.data.passengers || []);
      setDrivers(driv.data.drivers || []);
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = (activeTab === 'passengers' ? passengers : drivers)
    .filter(u =>
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

  const tabs = [
    { key: 'passengers', label: '👤 Passengers', count: passengers.length },
    { key: 'drivers', label: '🚗 Drivers', count: drivers.length },
  ];

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: COLORS.navy }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, margin: 0 }}>
          Users Management 👥
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 6 }}>
          Manage all registered users across the platform.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(''); }}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: `1px solid ${activeTab === tab.key ? COLORS.accent : COLORS.glassBorder}`,
              background: activeTab === tab.key ? `${COLORS.accent}20` : COLORS.glass,
              color: activeTab === tab.key ? COLORS.white : COLORS.textMuted,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 700 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.key ? COLORS.accent : COLORS.glassBorder,
              color: COLORS.white,
              borderRadius: 20,
              padding: '1px 8px',
              fontSize: 11,
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: COLORS.glass,
        border: `1px solid ${COLORS.glassBorder}`,
        borderRadius: 12,
        padding: '0 16px',
        height: 46,
        marginBottom: 20,
        maxWidth: 400,
      }}>
        <span style={{ marginRight: 10 }}>🔍</span>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: COLORS.white,
            fontSize: 14,
          }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: COLORS.glass,
        borderRadius: 20,
        border: `1px solid ${COLORS.glassBorder}`,
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'drivers'
            ? '2fr 2fr 1.5fr 1.5fr 1fr 1fr'
            : '2fr 2fr 1.5fr 1.5fr 1fr',
          padding: '14px 20px',
          borderBottom: `1px solid ${COLORS.glassBorder}`,
          background: 'rgba(255,255,255,0.03)',
        }}>
          {['Name', 'Email', 'Phone', 'Joined',
            ...(activeTab === 'drivers' ? ['License', 'Status'] : ['Status'])
          ].map(h => (
            <div key={h} style={{
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>
            No users found.
          </div>
        ) : (
          filtered.map((user, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: activeTab === 'drivers'
                  ? '2fr 2fr 1.5fr 1.5fr 1fr 1fr'
                  : '2fr 2fr 1.5fr 1.5fr 1fr',
                padding: '14px 20px',
                borderBottom: `1px solid ${COLORS.glassBorder}`,
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.light})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.white,
                  flexShrink: 0,
                }}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.white }}>
                  {user.name || 'N/A'}
                </span>
              </div>

              {/* Email */}
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                {user.email || 'N/A'}
              </div>

              {/* Phone */}
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                {user.phone || 'N/A'}
              </div>

              {/* Joined */}
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-PK')
                  : 'N/A'}
              </div>

              {/* Driver License */}
              {activeTab === 'drivers' && (
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  {user.license_number || 'N/A'}
                </div>
              )}

              {/* Status */}
              <div>
                <Badge
                  text={user.status || 'active'}
                  color={user.status === 'active' ? COLORS.green : COLORS.red}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Count */}
      <div style={{ marginTop: 16, color: COLORS.textMuted, fontSize: 13 }}>
        Showing {filtered.length} of {activeTab === 'passengers' ? passengers.length : drivers.length} {activeTab}
      </div>
    </div>
  );
}