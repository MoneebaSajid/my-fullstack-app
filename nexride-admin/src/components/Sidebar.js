import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const COLORS = {
  navy: '#0A1628',
  blue: '#1A3C6E',
  accent: '#2E86DE',
  light: '#4FC3F7',
  glass: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.12)',
  textMuted: 'rgba(255,255,255,0.55)',
  white: '#FFFFFF',
};

const navItems = [
  { path: '/',          icon: '📊', label: 'Dashboard' },
  { path: '/live-tracking', icon: '🗺️', label: 'Live Tracking' },  // ← ADD
  { path: '/users',     icon: '👥', label: 'Users' },
  { path: '/vehicles',  icon: '🚗', label: 'Vehicles' },
  { path: '/bookings',  icon: '📋', label: 'Bookings' },
  { path: '/payments',  icon: '💳', label: 'Payments' },
  { path: '/feedback',  icon: '⭐', label: 'Feedback' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/login');
  };

  return (
    <div style={{
      width: collapsed ? 70 : 240,
      minHeight: '100vh',
      backgroundColor: 'rgba(10,22,40,0.95)',
      borderRight: `1px solid ${COLORS.glassBorder}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'sticky',
      top: 0,
      backdropFilter: 'blur(20px)',
    }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '24px 0' : '24px 20px',
        borderBottom: `1px solid ${COLORS.glassBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.white, letterSpacing: 1 }}>
              Nex<span style={{ color: COLORS.accent }}>Ride</span>
            </div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 2, marginTop: 2 }}>
              ADMIN PANEL
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 8,
            color: COLORS.white,
            width: 32,
            height: 32,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Admin Info */}
      {!collapsed && (
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${COLORS.glassBorder}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.light})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.white,
              flexShrink: 0,
            }}>
              {JSON.parse(localStorage.getItem('adminInfo') || '{}')?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>
                {JSON.parse(localStorage.getItem('adminInfo') || '{}')?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Super Admin</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '14px 0' : '12px 20px',
                background: isActive
                  ? `linear-gradient(135deg, rgba(46,134,222,0.25), rgba(79,195,247,0.1))`
                  : 'transparent',
                border: 'none',
                borderLeft: isActive ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? COLORS.white : COLORS.textMuted,
                }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px', borderTop: `1px solid ${COLORS.glassBorder}` }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: collapsed ? '12px 0' : '11px 16px',
            background: 'rgba(255,71,87,0.1)',
            border: '1px solid rgba(255,71,87,0.2)',
            borderRadius: 10,
            color: '#FF4757',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
          }}
        >
          <span>🚪</span>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );
}