import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../../App';
import designTokens from '../styles/designTokens';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import VerificationSuccessScreen from '../screens/VerificationSuccessScreen';

// App screens
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import CameraScreen from '../screens/CameraScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SimpleNavigator from './DrawerNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export default function AuthNavigator() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading with orange background to match splash screen
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: designTokens.colors.primary[500], // Orange background
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: designTokens.colors.navy[900],
        },
        headerTintColor: designTokens.colors.text.inverse,
        headerTitleStyle: {
          fontWeight: designTokens.typography.fontWeight.bold,
        },
      }}
    >
      {!isAuthenticated ? (
        // Auth stack - user not logged in
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="EmailVerification"
            component={EmailVerificationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VerificationSuccess"
            component={VerificationSuccessScreen}
            options={{ headerShown: false }}
          />
        </Stack.Group>
      ) : (
        // App stack - user logged in - use SimpleNavigator (MVP)
        <Stack.Group>
          <Stack.Screen name="Main" component={SimpleNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'AskToddy' }} />
          <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'Take Photo' }} />
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{ title: 'Quote Results' }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
