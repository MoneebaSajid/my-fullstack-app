import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import TripStatusScreen from '../screens/driver/TripStatusScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';

const Stack = createStackNavigator();

export default function DriverNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ title: '🚗 Driver Panel' }}
      />
      <Stack.Screen
        name="TripStatus"
        component={TripStatusScreen}
        options={{ title: '🚦 Trip Status' }}
      />
      <Stack.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: '💰 My Earnings' }}
      />
    </Stack.Navigator>
  );
}