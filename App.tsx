import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import { AuthProvider } from './src/contexts/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import designTokens from './src/styles/designTokens';
import { AIService } from './src/services/ai';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Camera: undefined;
  Results: { imageUri: string; analysis?: any };
};

export default function App() {
  useEffect(() => {
    // Initialize AI Service on app startup
    const initializeServices = async () => {
      try {
        console.log('🚀 Initializing AI Service...');
        await AIService.initialize();
        
        // Optionally run a health check
        if (__DEV__) {
          const health = await AIService.healthCheck();
          console.log('🏥 AI Service Health:', health);
        }
      } catch (error) {
        console.error('Failed to initialize AI Service:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AuthNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  );
}
