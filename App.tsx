import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import { AuthProvider } from './src/contexts/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/services/NavigationService';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  EmailVerification: { email: string; password: string };
  VerificationSuccess: undefined;
  Home: undefined;
  Chat: undefined;
  Camera: undefined;
  Results: { imageUri: string; analysis?: any };
  Account: undefined;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <AuthNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  );
}
