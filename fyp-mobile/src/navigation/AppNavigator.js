import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PassengerNavigator from './PassengerNavigator';
import DriverNavigator from './DriverNavigator';
import SplashScreen    from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RefundPolicyScreen from '../screens/passenger/RefundPolicyScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PassengerApp" component={PassengerNavigator} />
      <Stack.Screen name="DriverApp" component={DriverNavigator} />
      <Stack.Screen name="Splash"      component={SplashScreen}
  options={{ headerShown: false }} />
<Stack.Screen name="Onboarding"  component={OnboardingScreen}
  options={{ headerShown: false }} />
  <Stack.Screen 
        name="RefundPolicy" 
        component={RefundPolicyScreen} 
        options={{ headerShown: false }} // Hides the default header so your custom one shows
      />
    </Stack.Navigator>
  );
}