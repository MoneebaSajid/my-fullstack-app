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
  yellow: '#FFD700',
};

const StatusBadge = ({ status }) => {
  const colors = {
    pending: COLORS.yellow,
    confirmed: COLORS.green,
    started: COLORS.orange,
    completed: COLORS.accent,
    cancelled: COLORS.red,
  };
  const color = colors[status] || COLORS.textMuted;
  return (
    <span style={{
      background: `${color}20`,
      border: `1px solid ${color}40`,
      color,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>{status}</span>
  );
};

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('with_driver');
  const [withDriver, setWithDriver] = useState([]);
  const [withoutDriver, setWithoutDriver] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/all');
      setWithDriver(res.data.bookings_with_driver || []);
      setWithoutDriver(res.data.bookings_without_driver || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const current = activeTab === 'with_driver' ? withDriver : withoutDriver;
  const filtered = current.filter(b =>
    (b.passenger_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.model || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'With Driver', value: withDriver.length, color: COLORS.accent },
    { label: 'Self Drive', value: withoutDriver.length, color: COLORS.light },
    { label: 'Completed', value: [...withDriver, ...withoutDriver].filter(b => b.status === 'completed').length, color: COLORS.green },
    { label: 'Pending', value: [...withDriver, ...withoutDriver].filter(b => b.status === 'pending').length, color: COLORS.yellow },
  ];

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: COLORS.navy }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, margin: 0 }}>
          Bookings 📋
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 6 }}>
          Monitor and manage all vehicle bookings.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 14,
            padding: '14px 22px',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'with_driver', label: '👨‍✈️ With Driver', count: withDriver.length },
          { key: 'without_driver', label: '🚗 Self Drive', count: withoutDriver.length },
        ].map(tab => (
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
              background: activeTab === tab.key ? COLORS.accent : 'rgba(255,255,255,0.1)',
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
        display: 'flex', alignItems: 'center',
        background: COLORS.glass,
        border: `1px solid ${COLORS.glassBorder}`,
        borderRadius: 12, padding: '0 16px',
        height: 46, marginBottom: 20, maxWidth: 400,
      }}>
        <span style={{ marginRight: 10 }}>🔍</span>
        <input
          placeholder="Search by passenger or vehicle..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: COLORS.white, fontSize: 14 }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: COLORS.glass,
        borderRadius: 20,
        border: `1px solid ${COLORS.glassBorder}`,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'with_driver'
            ? '1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1fr'
            : '1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr',
          padding: '14px 20px',
          borderBottom: `1px solid ${COLORS.glassBorder}`,
          background: 'rgba(255,255,255,0.03)',
        }}>
          {[
            'Passenger', 'Vehicle',
            ...(activeTab === 'with_driver' ? ['Driver'] : []),
            'Pickup', 'Dropoff', 'Amount', 'Status'
          ].map(h => (
            <div key={h} style={{
              fontSize: 11, fontWeight: 700,
              color: COLORS.textMuted,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>No bookings found.</div>
        ) : filtered.map((b, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: activeTab === 'with_driver'
                ? '1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1fr'
                : '1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr',
              padding: '14px 20px',
              borderBottom: `1px solid ${COLORS.glassBorder}`,
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Passenger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #2E86DE, #4FC3F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: COLORS.white, flexShrink: 0,
              }}>
                {(b.passenger_name || 'P').charAt(0)}
              </div>
              <span style={{ fontSize: 13, color: COLORS.white, fontWeight: 600 }}>
                {b.passenger_name || 'N/A'}
              </span>
            </div>

            {/* Vehicle */}
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>
              {b.model || 'N/A'}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{b.reg_number}</div>
            </div>

            {/* Driver — only with driver tab */}
            {activeTab === 'with_driver' && (
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                {b.driver_name || 'N/A'}
              </div>
            )}

            {/* Pickup */}
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              {(b.pickup_location || b.self_pickup_location || 'N/A').slice(0, 25)}
              {(b.pickup_location || b.self_pickup_location || '').length > 25 ? '...' : ''}
            </div>

            {/* Dropoff */}
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              {(b.dropoff_location || b.onsite_location || 'N/A').slice(0, 20)}
              {(b.dropoff_location || b.onsite_location || '').length > 20 ? '...' : ''}
            </div>

            {/* Amount */}
            <div style={{ fontSize: 13, color: COLORS.green, fontWeight: 700 }}>
              Rs. {b.total_amount}
            </div>

            {/* Status */}
            <StatusBadge status={b.status} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, color: COLORS.textMuted, fontSize: 13 }}>
        Showing {filtered.length} of {current.length} bookings
      </div>
    </div>
  );
}