import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';

const COLORS = {
  navy: '#0A1628',
  blue: '#1A3C6E',
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

const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{
    background: COLORS.glass,
    borderRadius: 20,
    border: `1px solid ${COLORS.glassBorder}`,
    padding: '24px',
    flex: 1,
    minWidth: 160,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: -20, right: -20,
      width: 80, height: 80, borderRadius: '50%',
      background: `${color}20`,
    }} />
    <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: color, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: COLORS.green, marginTop: 6 }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    vehicles: 0, passengers: 0, drivers: 0,
    bookings: 0, payments: 0, feedback: 0,
  });
  const [demand, setDemand] = useState({ peak_hours: [], peak_days: [] });
  const [fraud, setFraud] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [vehicles, bookings, payments, demand] = await Promise.all([
        api.get('/vehicles'),
        api.get('/bookings/all'),
        api.get('/payments/all'),
        api.get('/ai/demand'),
      ]);

      setStats({
        vehicles: vehicles.data.total || 0,
        bookings: bookings.data.bookings_with_driver?.length + bookings.data.bookings_without_driver?.length || 0,
        payments: payments.data.total || 0,
      });

      setDemand(demand.data);

    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const hourlyData = demand.hourly_breakdown?.map(h => ({
    name: `${h.hour}:00`,
    bookings: h.bookings,
  })) || [];

  const dailyData = demand.daily_breakdown?.map(d => ({
    name: d.day?.slice(0, 3),
    bookings: d.bookings,
  })) || [];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: COLORS.navy }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⟳</div>
          <div style={{ color: COLORS.textMuted }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: COLORS.navy }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, margin: 0 }}>
          Dashboard 📊
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 6 }}>
          Welcome back, {JSON.parse(localStorage.getItem('adminInfo') || '{}')?.name || 'Admin'} — here's what's happening today.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <StatCard icon="🚗" label="Total Vehicles" value={stats.vehicles} color={COLORS.accent} sub="Active fleet" />
        <StatCard icon="📋" label="Total Bookings" value={stats.bookings} color={COLORS.green} sub="All time" />
        <StatCard icon="💳" label="Payments" value={stats.payments} color={COLORS.orange} sub="Processed" />
        <StatCard icon="🤖" label="AI Features" value="4" color={COLORS.light} sub="Active models" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

        {/* Hourly Demand */}
        <div style={{
          background: COLORS.glass,
          borderRadius: 20,
          border: `1px solid ${COLORS.glassBorder}`,
          padding: 24,
        }}>
          <h3 style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, margin: '0 0 20px 0' }}>
            ⏰ Bookings by Hour
          </h3>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fontSize: 10 }} />
                <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#1A3C6E', border: 'none', borderRadius: 10, color: '#fff' }}
                />
                <Line type="monotone" dataKey="bookings" stroke={COLORS.accent} strokeWidth={2} dot={{ fill: COLORS.accent, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted }}>
              No data available yet
            </div>
          )}
        </div>

        {/* Daily Demand */}
        <div style={{
          background: COLORS.glass,
          borderRadius: 20,
          border: `1px solid ${COLORS.glassBorder}`,
          padding: 24,
        }}>
          <h3 style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, margin: '0 0 20px 0' }}>
            📅 Bookings by Day
          </h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1A3C6E', border: 'none', borderRadius: 10, color: '#fff' }}
                />
                <Bar dataKey="bookings" fill={COLORS.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted }}>
              No data available yet
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div style={{
        background: COLORS.glass,
        borderRadius: 20,
        border: `1px solid ${COLORS.glassBorder}`,
        padding: 24,
        marginBottom: 28,
      }}>
        <h3 style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, margin: '0 0 20px 0' }}>
          🤖 AI Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { icon: '💰', title: 'Dynamic Pricing', desc: 'Peak hours +30%, Weekends +20%', color: COLORS.green },
            { icon: '🚗', title: 'Recommendations', desc: 'Trip-based AI filtering active', color: COLORS.accent },
            { icon: '🔍', title: 'Fraud Detection', desc: 'Monitoring all passenger accounts', color: COLORS.orange },
            { icon: '📈', title: 'Demand Prediction', desc: demand.peak_days?.[0] ? `Peak: ${demand.peak_days[0].day}` : 'Analyzing...', color: COLORS.light },
          ].map((item, i) => (
            <div key={i} style={{
              background: `${item.color}10`,
              border: `1px solid ${item.color}25`,
              borderRadius: 14,
              padding: 16,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Info */}
      {demand.peak_hours?.length > 0 && (
        <div style={{
          background: COLORS.glass,
          borderRadius: 20,
          border: `1px solid ${COLORS.glassBorder}`,
          padding: 24,
        }}>
          <h3 style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>
            🔥 Peak Performance
          </h3>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>TOP PEAK HOURS</div>
              {demand.peak_hours.slice(0, 3).map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {i + 1}
                  </div>
                  <span style={{ color: COLORS.white, fontSize: 14 }}>{h.hour}:00</span>
                  <span style={{ color: COLORS.green, fontSize: 12, marginLeft: 'auto' }}>{h.bookings} bookings</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>TOP PEAK DAYS</div>
              {demand.peak_days.slice(0, 3).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: COLORS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {i + 1}
                  </div>
                  <span style={{ color: COLORS.white, fontSize: 14 }}>{d.day}</span>
                  <span style={{ color: COLORS.green, fontSize: 12, marginLeft: 'auto' }}>{d.bookings} bookings</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}