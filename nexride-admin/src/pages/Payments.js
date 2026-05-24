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
    color,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  }}>{text}</span>
);

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments/all');
      setPayments(res.data.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter(p =>
    (p.passenger_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.payment_method || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.transaction_reference || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const stats = [
    { label: 'Total Payments', value: payments.length, color: COLORS.accent },
    { label: 'Completed', value: payments.filter(p => p.payment_status === 'completed').length, color: COLORS.green },
    { label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, color: COLORS.orange },
    { label: 'Gateways Used', value: [...new Set(payments.map(p => p.payment_method))].length, color: COLORS.light },
  ];

  const getMethodColor = (method) => {
    const colors = {
      'JazzCash': '#c8102e',
      'Easypaisa': '#00a651',
      'HBL Pay': '#006400',
      'Visa': '#1a1f71',
      'Mastercard': '#eb001b',
      'Bank Transfer': '#003087',
    };
    return colors[method] || COLORS.accent;
  };

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: COLORS.navy }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, margin: 0 }}>
          Payments 💳
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 6 }}>
          Track all transactions and revenue.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 16,
            padding: '18px 24px',
            flex: 1,
            minWidth: 140,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gateway Breakdown */}
      <div style={{
        background: COLORS.glass,
        borderRadius: 20,
        border: `1px solid ${COLORS.glassBorder}`,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>
          💳 Payment Methods Breakdown
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[...new Set(payments.map(p => p.payment_method))].map((method, i) => {
            const count = payments.filter(p => p.payment_method === method).length;
            const revenue = payments
              .filter(p => p.payment_method === method && p.payment_status === 'completed')
              .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            return (
              <div key={i} style={{
                background: `${getMethodColor(method)}15`,
                border: `1px solid ${getMethodColor(method)}30`,
                borderRadius: 12,
                padding: '12px 16px',
                minWidth: 140,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 4 }}>
                  {method}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{count} transactions</div>
                <div style={{ fontSize: 13, color: COLORS.green, fontWeight: 600, marginTop: 4 }}>
                  Rs. {revenue.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
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
          placeholder="Search payments..."
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
          gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 1fr',
          padding: '14px 20px',
          borderBottom: `1px solid ${COLORS.glassBorder}`,
          background: 'rgba(255,255,255,0.03)',
        }}>
          {['Passenger', 'Reference', 'Amount', 'Method', 'Type', 'Status'].map(h => (
            <div key={h} style={{
              fontSize: 11, fontWeight: 700,
              color: COLORS.textMuted,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>No payments found.</div>
        ) : filtered.map((p, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 1fr',
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
                {(p.passenger_name || 'P').charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13, color: COLORS.white, fontWeight: 600 }}>
                  {p.passenger_name || 'N/A'}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {p.payment_time ? new Date(p.payment_time).toLocaleDateString('en-PK') : ''}
                </div>
              </div>
            </div>

            {/* Reference */}
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: 'monospace', letterSpacing: 0.5 }}>
              {p.transaction_reference || 'N/A'}
            </div>

            {/* Amount */}
            <div style={{ fontSize: 14, color: COLORS.green, fontWeight: 700 }}>
              Rs. {parseFloat(p.amount || 0).toLocaleString()}
            </div>

            {/* Method */}
            <div>
              <span style={{
                background: `${getMethodColor(p.payment_method)}20`,
                border: `1px solid ${getMethodColor(p.payment_method)}40`,
                color: COLORS.white,
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
              }}>
                {p.payment_method || 'N/A'}
              </span>
            </div>

            {/* Type */}
            <div style={{ fontSize: 12, color: COLORS.textMuted, textTransform: 'capitalize' }}>
              {p.payment_type || 'N/A'}
            </div>

            {/* Status */}
            <Badge
              text={p.payment_status || 'N/A'}
              color={p.payment_status === 'completed' ? COLORS.green : COLORS.red}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, color: COLORS.textMuted, fontSize: 13 }}>
        Showing {filtered.length} of {payments.length} payments
      </div>
    </div>
  );
}