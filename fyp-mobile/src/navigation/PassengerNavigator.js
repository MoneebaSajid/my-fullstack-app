import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import VehiclesScreen from '../screens/passenger/VehiclesScreen';
import VehicleDetailScreen from '../screens/passenger/VehicleDetailScreen';
import BookingScreen from '../screens/passenger/BookingScreen';
import MyBookingsScreen from '../screens/passenger/MyBookingsScreen';
import PaymentScreen from '../screens/passenger/PaymentScreen';
import ProfileScreen from '../screens/passenger/ProfileScreen';
import AIRecommendScreen from '../screens/passenger/AIRecommendScreen';
import FeedbackScreen from '../screens/passenger/FeedbackScreen';
import NearestDriversScreen from '../screens/passenger/NearestDriversScreen';
import TrackDriverScreen from '../screens/passenger/TrackDriverScreen';
import ReceiptScreen from '../screens/passenger/ReceiptScreen';

const Stack = createStackNavigator();

export default function PassengerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PassengerHome" component={VehiclesScreen} options={{ title: '🚗 NexRide' }} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book Vehicle' }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="AIRecommend" component={AIRecommendScreen} options={{ title: '🤖 AI Recommendation' }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: '⭐ Rate Experience' }} />
      <Stack.Screen name="NearestDrivers" component={NearestDriversScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TrackDriver" component={TrackDriverScreen} options={{ headerShown: false }} />
      <Stack.Screen
  name="Receipt"
  component={ReceiptScreen}
  options={{ title: '🧾 Receipt' }}
/>
    </Stack.Navigator>
  );
}