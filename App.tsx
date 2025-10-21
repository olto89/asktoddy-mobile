import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import { AuthProvider } from './src/contexts/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Chat: undefined;
  Camera: undefined;
  Results: { imageUri: string; analysis?: any };
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AuthNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  );
}
