import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import { AuthProvider } from './src/contexts/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/services/NavigationService';
import revenueCatService from './src/services/RevenueCatService';

export type RootStackParamList = {
  Login: undefined;
  EmailVerification: { email: string; password: string };
  VerificationSuccess: undefined;
  Main: undefined;
  SiteNotes: undefined;
  TaskList: { siteNotes: any; savedQuote?: any };
  EditQuote: { tasks: any[]; totalCost: any; siteNotes: any };
  ShareQuote: { quote: any };
  Home: undefined;
  Chat: undefined;
  Camera: undefined;
  Results: { imageUri: string; analysis?: any };
  Account: undefined;
};

export default function App() {
  // Initialize RevenueCat on app start
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        await revenueCatService.initialize();
        console.log('RevenueCat initialized in App');
      } catch (error) {
        console.warn('RevenueCat initialization failed:', error);
      }
    };

    initRevenueCat();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <AuthNavigator />
        <StatusBar style="light" backgroundColor="#FF6B35" translucent={false} />
      </NavigationContainer>
    </AuthProvider>
  );
}
