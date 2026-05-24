import React, { useState, useEffect, useRef } from 'react';
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

export default function LiveTracking() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchAllDrivers();
    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(fetchAllDrivers, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const fetchAllDrivers = async () => {
    try {
      const res = await api.get('/tracking/all-drivers');
      setDrivers(res.data.drivers || []);
      setLastUpdated(new Date().toLocaleTimeString('en-PK'));
    } catch (error) {
      console.error('Live tracking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'available') return COLORS.green;
    if (status === 'unavailable') return COLORS.red;
    return COLORS.orange;
  };

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: COLORS.navy }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, margin: 0 }}>
            🗺️ Live Driver Tracking
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 6 }}>
            Real-time location of all drivers • Auto-refreshes every 10 seconds
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdated && (
            <span style={{ color: COLORS.textMuted, fontSize: 12 }}>
              Last updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchAllDrivers}
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.light})`,
              border: 'none', borderRadius: 10,
              padding: '10px 18px', color: COLORS.white,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Drivers', value: drivers.length, color: COLORS.accent },
          { label: 'Online (GPS Active)', value: drivers.filter(d => d.current_latitude).length, color: COLORS.green },
          { label: 'Available', value: drivers.filter(d => d.availability_status === 'available').length, color: COLORS.light },
          { label: 'On Trip', value: drivers.filter(d => d.availability_status === 'unavailable').length, color: COLORS.orange },
        ].map((s, i) => (
          <div key={i} style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 14, padding: '14px 22px', flex: 1, minWidth: 120,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Map Placeholder + Driver List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* Map Area */}
        <div style={{
          background: COLORS.glass,
          borderRadius: 20,
          border: `1px solid ${COLORS.glassBorder}`,
          overflow: 'hidden',
          minHeight: 500,
          position: 'relative',
        }}>
          {/* OpenStreetMap via iframe */}
          <iframe
            title="NexRide Live Map"
            src={selectedDriver && selectedDriver.current_latitude
              ? `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(selectedDriver.current_longitude)-0.05},${parseFloat(selectedDriver.current_latitude)-0.05},${parseFloat(selectedDriver.current_longitude)+0.05},${parseFloat(selectedDriver.current_latitude)+0.05}&layer=mapnik&marker=${selectedDriver.current_latitude},${selectedDriver.current_longitude}`
              : `https://www.openstreetmap.org/export/embed.html?bbox=74.2587,31.4204,74.4587,31.6204&layer=mapnik`
            }
            style={{ width: '100%', height: '100%', border: 'none', minHeight: 500 }}
          />

          {/* Overlay info */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(10,22,40,0.9)',
            borderRadius: 10, padding: '8px 14px',
            border: `1px solid ${COLORS.glassBorder}`,
          }}>
            {selectedDriver ? (
              <div>
                <div style={{ color: COLORS.white, fontSize: 13, fontWeight: 700 }}>
                  🚗 {selectedDriver.name}
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>
                  {selectedDriver.model || 'Vehicle'} • {selectedDriver.reg_number}
                </div>
                <div style={{ color: COLORS.light, fontSize: 11, marginTop: 2 }}>
                  📍 {parseFloat(selectedDriver.current_latitude).toFixed(4)}, {parseFloat(selectedDriver.current_longitude).toFixed(4)}
                </div>
              </div>
            ) : (
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>
                Click a driver to see their location
              </div>
            )}
          </div>
        </div>

        {/* Drivers List */}
        <div style={{
          background: COLORS.glass,
          borderRadius: 20,
          border: `1px solid ${COLORS.glassBorder}`,
          overflow: 'hidden',
          maxHeight: 500,
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${COLORS.glassBorder}`,
            background: 'rgba(255,255,255,0.03)',
            position: 'sticky', top: 0,
          }}>
            <h3 style={{ color: COLORS.white, margin: 0, fontSize: 15, fontWeight: 700 }}>
              All Drivers ({drivers.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>
              Loading drivers...
            </div>
          ) : drivers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>
              No drivers with active GPS found.
            </div>
          ) : drivers.map((driver, i) => (
            <div
              key={i}
              onClick={() => setSelectedDriver(driver)}
              style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${COLORS.glassBorder}`,
                cursor: 'pointer',
                background: selectedDriver?.driver_id === driver.driver_id
                  ? 'rgba(46,134,222,0.1)' : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => {
                if (selectedDriver?.driver_id !== driver.driver_id)
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={e => {
                if (selectedDriver?.driver_id !== driver.driver_id)
                  e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.light})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: COLORS.white,
                }}>
                  {(driver.name || 'D').charAt(0)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.white }}>
                      {driver.name}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 20,
                      background: `${getStatusColor(driver.availability_status)}20`,
                      border: `1px solid ${getStatusColor(driver.availability_status)}40`,
                      color: getStatusColor(driver.availability_status),
                    }}>
                      {driver.availability_status || 'unknown'}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                    🚗 {driver.model || 'No vehicle'} • {driver.reg_number || ''}
                  </div>

                  {driver.current_latitude ? (
                    <div style={{ fontSize: 10, color: COLORS.green, marginTop: 3 }}>
                      📍 {parseFloat(driver.current_latitude).toFixed(4)}, {parseFloat(driver.current_longitude).toFixed(4)}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: COLORS.red, marginTop: 3 }}>
                      📍 GPS not active
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}