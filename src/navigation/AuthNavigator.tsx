import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../../App';
import designTokens from '../styles/designTokens';

// Auth screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';

// App screens  
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import CameraScreen from '../screens/CameraScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AuthNavigator() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: designTokens.colors.navy[900],
      }}>
        <ActivityIndicator size="large" color={designTokens.colors.primary[500]} />
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
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
        </Stack.Group>
      ) : (
        // App stack - user logged in - go directly to Chat with custom header
        <Stack.Group>
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'AskToddy' }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
            options={{ title: 'Take Photo' }}
          />
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