import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Vehicles from './pages/Vehicles';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Feedback from './pages/Feedback';
import Sidebar from './components/Sidebar';
import './App.css';
import LiveTracking from './pages/LiveTracking';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" />;
};

const AdminLayout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#0A1628' }}>
    <Sidebar />
    <div style={{ flex: 1, overflow: 'auto' }}>
      {children}
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout><Dashboard /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <AdminLayout><Users /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/vehicles" element={
          <ProtectedRoute>
            <AdminLayout><Vehicles /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute>
            <AdminLayout><Bookings /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute>
            <AdminLayout><Payments /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute>
            <AdminLayout><Feedback /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/live-tracking" element={
  <ProtectedRoute>
    <AdminLayout><LiveTracking /></AdminLayout>
  </ProtectedRoute>
} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;