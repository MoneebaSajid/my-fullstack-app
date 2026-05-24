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

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#0D1F3C',
        borderRadius: 20,
        border: `1px solid ${COLORS.glassBorder}`,
        padding: 32,
        width: '90%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ color: COLORS.white, margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${COLORS.glassBorder}`,
        borderRadius: 10,
        padding: '12px 14px',
        color: COLORS.white,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  </div>
);

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    reg_number: '', vehicle_type_id: '1', model: '',
    color: '', year: '', fare_per_hour: '',
    fare_per_km: '', fare_per_day: '',
  });

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data.vehicles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.post('/vehicles/add', form);
      alert('✅ Vehicle added successfully!');
      setShowAdd(false);
      resetForm();
      fetchVehicles();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleEdit = async () => {
    try {
      await api.put(`/vehicles/update/${selected.vehicle_id}`, form);
      alert('✅ Vehicle updated successfully!');
      setShowEdit(false);
      fetchVehicles();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/delete/${id}`);
      fetchVehicles();
    } catch (e) {
      alert('Failed to delete vehicle');
    }
  };

  const openEdit = (v) => {
    setSelected(v);
    setForm({
      reg_number: v.reg_number,
      vehicle_type_id: v.vehicle_type_id,
      model: v.model,
      color: v.color,
      year: v.year,
      fare_per_hour: v.fare_per_hour,
      fare_per_km: v.fare_per_km,
      fare_per_day: v.fare_per_day,
    });
    setShowEdit(true);
  };

  const resetForm = () => setForm({
    reg_number: '', vehicle_type_id: '1', model: '',
    color: '', year: '', fare_per_hour: '',
    fare_per_km: '', fare_per_day: '',
  });

  const filtered = vehicles.filter(v =>
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.reg_number?.toLowerCase().includes(search.toLowerCase())
  );

  const FormFields = () => (
    <>
      <InputField label="Registration Number" value={form.reg_number} onChange={e => setForm({ ...form, reg_number: e.target.value })} placeholder="e.g. LHR-1001" />
      <InputField label="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="e.g. Toyota Corolla" />
      <InputField label="Color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="e.g. White" />
      <InputField label="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2023" type="number" />
      <InputField label="Fare Per Hour (Rs)" value={form.fare_per_hour} onChange={e => setForm({ ...form, fare_per_hour: e.target.value })} placeholder="e.g. 2000" type="number" />
      <InputField label="Fare Per KM (Rs)" value={form.fare_per_km} onChange={e => setForm({ ...form, fare_per_km: e.target.value })} placeholder="e.g. 50" type="number" />
      <InputField label="Fare Per Day (Rs)" value={form.fare_per_day} onChange={e => setForm({ ...form, fare_per_day: e.target.value })} placeholder="e.g. 8000" type="number" />
    </>
  );

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: COLORS.navy }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, margin: 0 }}>
            Vehicles 🚗
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 6 }}>
            Manage your complete vehicle fleet.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.light})`,
            border: 'none',
            borderRadius: 12,
            padding: '12px 22px',
            color: COLORS.white,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: vehicles.length, color: COLORS.accent },
          { label: 'Available', value: vehicles.filter(v => v.availability === 'available' || v.availability === 'Available').length, color: COLORS.green },
          { label: 'Booked', value: vehicles.filter(v => v.availability === 'booked').length, color: COLORS.orange },
        ].map((s, i) => (
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
          placeholder="Search vehicles..."
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
          gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
          padding: '14px 20px',
          borderBottom: `1px solid ${COLORS.glassBorder}`,
          background: 'rgba(255,255,255,0.03)',
        }}>
          {['Model', 'Reg Number', 'Color', 'Year', 'Per Hour', 'Per Day', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Loading vehicles...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>No vehicles found.</div>
        ) : filtered.map((v, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
              padding: '14px 20px',
              borderBottom: `1px solid ${COLORS.glassBorder}`,
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(46,134,222,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>🚗</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.white }}>{v.model}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{v.type_name}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, letterSpacing: 1 }}>{v.reg_number}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>{v.color}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>{v.year}</div>
            <div style={{ fontSize: 13, color: COLORS.green, fontWeight: 600 }}>Rs. {v.fare_per_hour}</div>
            <div style={{ fontSize: 13, color: COLORS.green, fontWeight: 600 }}>Rs. {v.fare_per_day}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => openEdit(v)}
                style={{
                  background: 'rgba(46,134,222,0.15)',
                  border: `1px solid rgba(46,134,222,0.3)`,
                  borderRadius: 8, padding: '6px 12px',
                  color: COLORS.accent, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >Edit</button>
              <button
                onClick={() => handleDelete(v.vehicle_id)}
                style={{
                  background: 'rgba(255,71,87,0.1)',
                  border: `1px solid rgba(255,71,87,0.3)`,
                  borderRadius: 8, padding: '6px 12px',
                  color: COLORS.red, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal show={showAdd} onClose={() => setShowAdd(false)} title="➕ Add New Vehicle">
        <FormFields />
        <button
          onClick={handleAdd}
          style={{
            width: '100%', padding: '13px',
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.light})`,
            border: 'none', borderRadius: 12,
            color: COLORS.white, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
          }}
        >Add Vehicle</button>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit Vehicle">
        <FormFields />
        <button
          onClick={handleEdit}
          style={{
            width: '100%', padding: '13px',
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.light})`,
            border: 'none', borderRadius: 12,
            color: COLORS.white, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
          }}
        >Save Changes</button>
      </Modal>

    </div>
  );
}