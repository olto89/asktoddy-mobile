import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import designTokens from './src/styles/designTokens';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Camera: undefined;
  Results: { imageUri: string; analysis?: any };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
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
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
