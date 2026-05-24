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

const Stars = ({ rating }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <span key={s} style={{
        fontSize: 14,
        color: s <= rating ? COLORS.yellow : 'rgba(255,255,255,0.15)',
      }}>★</span>
    ))}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{
    background: `${color}20`,
    border: `1px solid ${color}40`,
    color,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
  }}>{text}</span>
);

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/feedback/all');
      setFeedbacks(res.data.feedback || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = feedbacks.filter(f => {
    const matchSearch =
      (f.passenger_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.comments || '').toLowerCase().includes(search.toLowerCase());
    const matchRating = filterRating === 'all' || f.rating === parseInt(filterRating);
    const matchType = filterType === 'all' || f.feedback_type === filterType;
    return matchSearch && matchRating && matchType;
  });

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: feedbacks.filter(f => f.rating === r).length,
    pct: feedbacks.length > 0
      ? Math.round((feedbacks.filter(f => f.rating === r).length / feedbacks.length) * 100)
      : 0,
  }));

  const types = ['all', ...new Set(feedbacks.map(f => f.feedback_type).filter(Boolean))];

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: COLORS.navy }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, margin: 0 }}>
          Feedback ⭐
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 6 }}>
          Monitor customer reviews and ratings.
        </p>
      </div>

      {/* Top Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 28 }}>

        {/* Average Rating Card */}
        <div style={{
          background: COLORS.glass,
          borderRadius: 20,
          border: `1px solid ${COLORS.glassBorder}`,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: COLORS.yellow, lineHeight: 1 }}>
            {avgRating}
          </div>
          <div style={{ display: 'flex', gap: 4, margin: '10px 0' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} style={{
                fontSize: 22,
                color: s <= Math.round(avgRating) ? COLORS.yellow : 'rgba(255,255,255,0.15)',
              }}>★</span>
            ))}
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>
            Average from {feedbacks.length} reviews
          </div>
        </div>

        {/* Rating Distribution */}
        <div style={{
          background: COLORS.glass,
          borderRadius: 20,
          border: `1px solid ${COLORS.glassBorder}`,
          padding: 24,
        }}>
          <h3 style={{ color: COLORS.white, fontSize: 15, fontWeight: 700, margin: '0 0 16px 0' }}>
            Rating Distribution
          </h3>
          {ratingDist.map(({ rating, count, pct }) => (
            <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 2, width: 80, flexShrink: 0 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} style={{ fontSize: 11, color: s <= rating ? COLORS.yellow : 'rgba(255,255,255,0.1)' }}>★</span>
                ))}
              </div>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: rating >= 4 ? COLORS.green : rating === 3 ? COLORS.orange : COLORS.red,
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, width: 60, textAlign: 'right' }}>
                {count} ({pct}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Reviews', value: feedbacks.length, color: COLORS.accent },
          { label: '5 Star', value: feedbacks.filter(f => f.rating === 5).length, color: COLORS.green },
          { label: '3 Star & Below', value: feedbacks.filter(f => f.rating <= 3).length, color: COLORS.red },
          { label: 'Avg Rating', value: avgRating, color: COLORS.yellow },
        ].map((s, i) => (
          <div key={i} style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 14,
            padding: '14px 22px',
            flex: 1, minWidth: 120,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: COLORS.glass,
          border: `1px solid ${COLORS.glassBorder}`,
          borderRadius: 12, padding: '0 16px',
          height: 44, flex: 1, maxWidth: 320,
        }}>
          <span style={{ marginRight: 10 }}>🔍</span>
          <input
            placeholder="Search feedback..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: COLORS.white, fontSize: 14 }}
          />
        </div>

        {/* Rating Filter */}
        <select
          value={filterRating}
          onChange={e => setFilterRating(e.target.value)}
          style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 12, padding: '10px 16px',
            color: COLORS.white, fontSize: 14, cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all" style={{ background: '#0D1F3C' }}>All Ratings</option>
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r} style={{ background: '#0D1F3C' }}>{'★'.repeat(r)} ({r} Star)</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 12, padding: '10px 16px',
            color: COLORS.white, fontSize: 14, cursor: 'pointer', outline: 'none',
          }}
        >
          {types.map(t => (
            <option key={t} value={t} style={{ background: '#0D1F3C' }}>
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Feedback Cards */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Loading feedback...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>No feedback found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((f, i) => (
            <div key={i} style={{
              background: COLORS.glass,
              borderRadius: 16,
              border: `1px solid ${COLORS.glassBorder}`,
              padding: 20,
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.glassBorder}
            >
              {/* Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'linear-gradient(135deg, #2E86DE, #4FC3F7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: COLORS.white,
                  }}>
                    {(f.passenger_name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>
                      {f.passenger_name || 'Anonymous'}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      {f.created_at ? new Date(f.created_at).toLocaleDateString('en-PK') : ''}
                    </div>
                  </div>
                </div>
                <Badge
                  text={f.feedback_type || 'general'}
                  color={COLORS.accent}
                />
              </div>

              {/* Stars */}
              <Stars rating={f.rating || 0} />

              {/* Comment */}
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 13,
                lineHeight: 1.6,
                margin: '10px 0 12px',
              }}>
                "{f.comments || 'No comment provided.'}"
              </p>

              {/* Driver */}
              {f.driver_name && (
                <div style={{
                  background: 'rgba(46,134,222,0.1)',
                  border: `1px solid rgba(46,134,222,0.2)`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: COLORS.light,
                }}>
                  👨‍✈️ Driver: {f.driver_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, color: COLORS.textMuted, fontSize: 13 }}>
        Showing {filtered.length} of {feedbacks.length} reviews
      </div>
    </div>
  );
}