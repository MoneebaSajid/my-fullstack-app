const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const db = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const receiptRoutes = require('./routes/receipt.routes');
const trackingRoutes = require('./routes/tracking.routes');
const aiRoutes = require('./routes/ai.routes');
const driverRoutes = require('./routes/driver.routes'); 
const passengerRoutes = require('./routes/passenger.routes');
const feedbackRoutes = require('./routes/feedback.routes'); // ← ADD

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8081', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));app.use(express.json());

db.query('SELECT 1')
  .then(() => console.log('✅ MySQL Connected Successfully'))
  .catch(err => console.error('❌ DB Connection Failed:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/drivers', driverRoutes); 
app.use('/api/passengers', passengerRoutes);
app.use('/api/feedback', feedbackRoutes);// ← ADD

// Socket.io — Real time tracking
// Socket.io — Real time tracking
const activeDrivers = {};

io.on('connection', (socket) => {
  console.log('🔌 New connection:', socket.id);

  // Driver joins with their ID
  socket.on('driver:join', (driver_id) => {
    activeDrivers[driver_id] = socket.id;
    socket.join(`driver_${driver_id}`);
    console.log(`👨‍✈️ Driver ${driver_id} joined`);
  });

  // Passenger joins to track specific driver
  socket.on('passenger:track', (driver_id) => {
    socket.join(`tracking_${driver_id}`);
    console.log(`👤 Passenger tracking driver ${driver_id}`);
    // Send current location if available
    if (activeDrivers[driver_id]) {
      socket.emit('tracking:joined', { driver_id, message: 'Now tracking driver!' });
    } else {
      socket.emit('tracking:offline', { driver_id, message: 'Driver GPS not active' });
    }
  });

  // Driver sends location — broadcast to tracking room
  socket.on('driver:location', (data) => {
    const { driver_id, latitude, longitude, speed, heading } = data;
    activeDrivers[driver_id] = socket.id;
    // Broadcast to all passengers tracking this driver
    io.to(`tracking_${driver_id}`).emit('driver:location:update', {
      driver_id, latitude, longitude, speed, heading,
      timestamp: new Date().toISOString()
    });
    // Also broadcast to admin
    io.emit('admin:driver:update', { driver_id, latitude, longitude });
    console.log(`📍 Driver ${driver_id}: ${latitude}, ${longitude}`);
  });

  socket.on('disconnect', () => {
    // Remove from active drivers
    Object.keys(activeDrivers).forEach(did => {
      if (activeDrivers[did] === socket.id) {
        delete activeDrivers[did];
        io.emit('driver:offline', { driver_id: did });
        console.log(`❌ Driver ${did} disconnected`);
      }
    });
  });
});

app.get('/', (req, res) => {
  res.json({ message: '🚗 Vehicle Rental API is running!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});