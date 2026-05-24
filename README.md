<div align="center">

# 🚗 NexRide
### Web & Mobile Based AI-Driven Vehicle Rental System

![NexRide Banner](./assets/logo.png)

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_55-blue?style=for-the-badge&logo=react)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React.js-Admin_Panel-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=for-the-badge&logo=mysql)](https://mysql.com)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**Final Year Project — BS Software Engineering 2022–2026**
**GC University Faisalabad**

*Moneeba Sajid (2022-GCUF-02615) · Wania Sultan (2022-GCUF-02599)*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Pricing Logic](#-pricing-logic)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Team](#-team)

---

## 🌟 Overview

**NexRide** is a full-stack AI-driven vehicle rental system that allows passengers to book vehicles with or without a driver, track drivers in real-time via GPS, make payments through multiple gateways, and receive digital receipts — all from a mobile app. A web-based admin panel provides complete management of users, vehicles, bookings, payments, and live tracking.

The system uses AI-based dynamic pricing, real-time Socket.io tracking, and Haversine-based distance calculation to deliver an accurate and intelligent rental experience.

---

## ✨ Features

### 👤 Passenger
- Register & login with role-based authentication (JWT)
- Browse vehicles with search & filters
- Book with driver or self-drive
- GPS auto-detect pickup/dropoff location
- Haversine-based real-time distance calculation
- Auto end-time generation based on distance ÷ speed
- Dynamic fare preview before booking
- Live driver tracking on map (Socket.io)
- Find nearest available drivers (Haversine radius)
- 6-gateway payment system
- Digital receipt generation
- Submit feedback & ratings
- Manage profile (CNIC, phone, photo)

### 👨‍✈️ Driver
- Separate registration & login
- Toggle GPS availability status
- Real-time location broadcasting via Socket.io
- View assigned bookings & trip lifecycle
- Earnings dashboard

### 👑 Admin (Web Panel)
- Secure admin dashboard
- Manage passengers & drivers
- Full vehicle CRUD
- View all bookings (with/without driver)
- Payment analytics & gateway breakdown
- Live GPS tracking of all drivers
- Feedback & rating management
- Revenue charts (hourly/daily)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Mobile App** | React Native + Expo SDK 55 |
| **Admin Web** | React.js + Recharts |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL 8.0 (22 tables, 3NF) |
| **Real-time** | Socket.io |
| **Auth** | JWT + bcrypt |
| **Maps** | expo-location + OpenStreetMap |
| **Distance** | Haversine Formula |
| **AI Pricing** | Custom Node.js inference engine |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌──────────────────┐      ┌──────────────────────────┐ │
│  │  React Native     │      │   React.js Admin Panel   │ │
│  │  Mobile App       │      │   (localhost:3000)        │ │
│  │  (Expo Go)        │      │                          │ │
│  └────────┬─────────┘      └────────────┬─────────────┘ │
└───────────┼────────────────────────────┼───────────────┘
            │ HTTP/REST + JWT            │ HTTP/REST + JWT
            ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND LAYER (Port 5000)               │
│                                                          │
│  Express.js API Server                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │   Auth   │ │ Booking  │ │ Vehicle  │ │  Payment  │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Tracking │ │   AI     │ │  Driver  │ │ Feedback  │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│                                                          │
│  Socket.io Server (Real-time GPS)                        │
│  autoRelease.js (Cron — every 5 min)                    │
└─────────────────────────┬───────────────────────────────┘
                          │ MySQL2
                          ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE LAYER (MySQL 8.0)                  │
│         vehicle_rental_system — 22 Tables                │
└─────────────────────────────────────────────────────────┘
```

### Real-time Tracking Architecture
```
Driver App                Backend (Socket.io)         Passenger App
    │                           │                           │
    │── driver:join ──────────► │                           │
    │   {driver_id, coords}     │                           │
    │                           │◄── passenger:track ───────│
    │                           │    {driver_id}            │
    │── driver:location ───────►│                           │
    │   {lat, lon}              │── driver:location ───────►│
    │                           │   :update {lat, lon}      │
    │── driver:offline ────────►│                           │
    │                           │── driver:offline ────────►│
```

---

## 💰 Pricing Logic

NexRide uses a transparent, rule-based fare calculation system:

### Rate Types

| Rate Type | Formula |
|---|---|
| **Hourly** | `⌈hours⌉ × fare_per_hour` |
| **Daily** | `⌈days⌉ × (fare_per_hour × 12)` |
| **Per KM** | `distance_km × Rs. 25` |

> **Per Day = Per Hour × 12** — because 1 working day = 12 billable hours

### Distance Charge (Hourly & Daily only)
```
Distance Charge = km × Rs. 25/km
```

### Driver Fee (Experience-Based)

| Experience | Rate/Hour | Minimum Fee |
|---|---|---|
| 0–2 years | Rs. 500/hr | Rs. 2,000 |
| 3–4 years | Rs. 700/hr | Rs. 3,000 |
| 5+ years | Rs. 1,000/hr | Rs. 4,000 |

### GST
```
Tax = 5% × Subtotal
```

### Complete Formula
```
Subtotal   = Base Fare + Distance Charge + Driver Fee
Tax        = Subtotal × 5%
TOTAL      = Subtotal + Tax
```

### Example Calculation
```
Vehicle:    Toyota Corolla  (Rs. 1,500/hr)
Booking:    With Driver · Hourly · 3 hrs · 25 km
Driver:     5 years experience

Base Fare:        3 hrs × Rs. 1,500     = Rs.  4,500
Distance Charge:  25 km × Rs. 25        = Rs.    625
Driver Fee:       max(3×1000, 4000)     = Rs.  4,000
─────────────────────────────────────────────────────
Subtotal:                                = Rs.  9,125
GST (5%):                                = Rs.    456
─────────────────────────────────────────────────────
TOTAL:                                   = Rs.  9,581
```

---

## 📁 Project Structure

```
nexride-fyp/
│
├── fyp_backend/                    # Node.js Backend
│   ├── config/
│   │   └── db.js                   # MySQL connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js   # Core fare logic
│   │   ├── vehicle.controller.js
│   │   ├── payment.controller.js
│   │   ├── receipt.controller.js
│   │   ├── tracking.controller.js
│   │   ├── ai.controller.js
│   │   ├── driver.controller.js
│   │   ├── passenger.controller.js
│   │   └── feedback.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── payment.routes.js
│   │   ├── receipt.routes.js
│   │   ├── tracking.routes.js
│   │   ├── ai.routes.js
│   │   ├── driver.routes.js
│   │   ├── passenger.routes.js
│   │   └── feedback.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── autoRelease.js              # Auto-complete expired bookings
│   ├── server.js                   # Main entry + Socket.io
│   ├── .env
│   └── package.json
│
├── fyp-mobile/                     # React Native Mobile App
│   ├── assets/
│   │   └── logo.png
│   ├── src/
│   │   ├── navigation/
│   │   │   ├── AppNavigator.js
│   │   │   ├── PassengerNavigator.js
│   │   │   └── DriverNavigator.js
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.js
│   │   │   │   ├── RegisterScreen.js
│   │   │   │   └── DriverRegisterScreen.js
│   │   │   ├── passenger/
│   │   │   │   ├── VehiclesScreen.js
│   │   │   │   ├── VehicleDetailScreen.js
│   │   │   │   ├── BookingScreen.js       ← Fare logic + GPS
│   │   │   │   ├── MyBookingsScreen.js
│   │   │   │   ├── PaymentScreen.js
│   │   │   │   ├── ReceiptScreen.js
│   │   │   │   ├── ProfileScreen.js
│   │   │   │   ├── AIRecommendScreen.js
│   │   │   │   ├── FeedbackScreen.js
│   │   │   │   ├── NearestDriversScreen.js
│   │   │   │   └── TrackDriverScreen.js
│   │   │   └── driver/
│   │   │       ├── DriverHomeScreen.js    ← GPS broadcast
│   │   │       ├── TripStatusScreen.js
│   │   │       └── EarningsScreen.js
│   │   └── services/
│   │       └── api.js
│   ├── App.js
│   ├── app.json
│   └── package.json
│
└── nexride-admin/                  # React.js Admin Panel
    ├── src/
    │   ├── services/
    │   │   └── api.js
    │   ├── components/
    │   │   └── Sidebar.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Dashboard.js
    │   │   ├── Users.js
    │   │   ├── Vehicles.js
    │   │   ├── Bookings.js
    │   │   ├── Payments.js
    │   │   ├── Feedback.js
    │   │   └── LiveTracking.js
    │   └── App.js
    └── package.json
```

---

## 🗄 Database Schema

**Database:** `vehicle_rental_system` | **Tables:** 22 | **Normal Form:** 3NF

```
Core Tables:
├── Passenger          (passenger_id, name, email, phone, cnic, ...)
├── Driver             (driver_id, name, email, cnic, license_number,
│                       experience_years, availability_status, ...)
├── Admin              (admin_id, name, email, role, ...)
├── Vehicle            (vehicle_id, model, reg_number, type, color,
│                       fare_per_hour, fare_per_day, fare_per_km,
│                       availability, ...)
│
Booking Tables:
├── BookingWithDriver  (booking_id, passenger_id, vehicle_id, driver_id,
│                       start_time, end_time, rate_type, total_amount,
│                       pickup_location, dropoff_location,
│                       estimated_distance, status, ...)
└── BookingWithoutDriver (booking_id, passenger_id, vehicle_id,
                          start_date, end_date, rate_type, total_amount,
                          self_pickup_location, onsite_location, ...)

Support Tables:
├── Payment            (payment_id, booking_id, method, amount, status)
├── Receipt            (receipt_id, receipt_number, total_fare,
│                       tax_amount, payment_status, ...)
├── Feedback           (feedback_id, passenger_id, driver_id, rating, comment)
└── Tracking           (tracking_id, driver_id, latitude, longitude, timestamp)
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0
- Expo Go app (on mobile)
- Git

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/MoneebaSajid/nexride-fyp.git
cd nexride-fyp
```

---

### 2️⃣ Database Setup

```sql
CREATE DATABASE vehicle_rental_system;
USE vehicle_rental_system;
-- Run the provided SQL schema file
SOURCE database/schema.sql;
```

---

### 3️⃣ Backend Setup

```bash
cd fyp_backend
npm install
```

Create `.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vehicle_rental_system
JWT_SECRET=vrental@2024#secure!lahore
```

Start backend:
```bash
npm run dev
# Server runs on http://localhost:5000
```

---

### 4️⃣ Mobile App Setup

```bash
cd fyp-mobile
npm install
```

Update IP in `src/services/api.js`:
```javascript
// Replace with your WiFi IP (run ipconfig to find it)
baseURL: 'http://YOUR_WIFI_IP:5000/api'
```

Start mobile app:
```bash
npx expo start --clear
# Scan QR code with Expo Go app
```

---

### 5️⃣ Admin Panel Setup

```bash
cd nexride-admin
npm install
npm start
# Opens at http://localhost:3000
```

---

### Quick Reset (If vehicles/drivers stuck)

```sql
UPDATE Vehicle SET availability = 'available' WHERE vehicle_id > 0;
UPDATE Driver SET availability_status = 'available' WHERE driver_id > 0;
```

---

## 📡 API Documentation

**Base URL:** `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/passenger/register` | Passenger registration |
| POST | `/auth/passenger/login` | Passenger login |
| POST | `/auth/driver/register` | Driver registration |
| POST | `/auth/driver/login` | Driver login |
| POST | `/auth/admin/register` | Admin registration |
| POST | `/auth/admin/login` | Admin login |

### Vehicles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/vehicles` | Get all vehicles |
| GET | `/vehicles/:id` | Get vehicle by ID |
| POST | `/vehicles` | Add vehicle (Admin) |
| PUT | `/vehicles/:id` | Update vehicle (Admin) |
| DELETE | `/vehicles/:id` | Delete vehicle (Admin) |

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings/with-driver` | Create booking with driver |
| POST | `/bookings/without-driver` | Create self-drive booking |
| GET | `/bookings/my-bookings` | Get passenger bookings |
| GET | `/bookings/all` | Get all bookings (Admin) |
| GET | `/bookings/driver` | Get driver bookings |
| PUT | `/bookings/:id/status` | Update booking status |

### Payments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/create` | Process payment |
| GET | `/payments/my-payments` | Get passenger payments |
| GET | `/payments/all` | Get all payments (Admin) |

### Tracking

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tracking/nearest` | Get nearest drivers |
| POST | `/tracking/update` | Update driver location |
| GET | `/tracking/all-drivers` | All driver locations (Admin) |

### AI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/recommend` | AI vehicle recommendation |
| POST | `/ai/dynamic-price` | Dynamic pricing preview |

---

## 📱 App Screens

### Passenger Flow
```
Login/Register → Vehicles List → Vehicle Detail
→ Booking Screen (GPS + Fare Preview + Driver Select)
→ Payment Screen → Receipt Screen
→ My Bookings → Track Driver (Live Map)
→ Nearest Drivers → Profile → Feedback
```

### Driver Flow
```
Login → Driver Home (GPS Toggle + Stats)
→ Trip Status (4-stage lifecycle) → Earnings
```

### Admin Flow
```
Login → Dashboard (Charts + AI Insights)
→ Users (Passengers + Drivers)
→ Vehicles (CRUD) → Bookings → Payments
→ Feedback → Live Tracking (All Drivers)
```

---

## 🔑 Field Validations

| Field | Rule |
|---|---|
| **CNIC** | Pakistani format: `XXXXX-XXXXXXX-X` (13 digits only) |
| **Phone** | Pakistani format: `03XXXXXXXXX` (11 digits) |
| **Name** | Letters and spaces only (max 50 chars) |
| **Password** | Min 6 chars + at least 1 number |
| **License No** | Alphanumeric + dash (max 15 chars) |
| **Distance** | Numeric only, 1–2000 km |
| **Special Requests** | Any text (max 300 chars) |

---

## 👥 Team

<div align="center">

| | Developer | Student ID |
|---|---|---|
| 👩‍💻 | **Moneeba Sajid** | 2022-GCUF-02615 |
| 👩‍💻 | **Wania Sultan** | 2022-GCUF-02599 |

**Supervisor:** *(Prof.Dr Khurram Zeeshan)*
**Department:** Software Engineering
**University:** GC University Faisalabad
**Session:** BS Software Engineering 2022–2026

</div>

---

## 📄 License

This project is developed as a Final Year Project for academic purposes at GC University Faisalabad.

---

<div align="center">

**⭐ If you find this project helpful, please give it a star! ⭐**

Made with ❤️ by Moneeba Sajid & Wania Sultan — GCUF 2026

</div>
