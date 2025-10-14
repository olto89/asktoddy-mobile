import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import designTokens from '../styles/designTokens';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo placeholder - will be replaced with actual logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>AT</Text>
          </View>
          <Text style={styles.brandName}>AskToddy</Text>
          <Text style={styles.tagline}>AI-powered construction quotes</Text>
        </View>

        <View style={styles.footer}>
          <ActivityIndicator 
            size="large" 
            color={designTokens.colors.primary[500]} 
            style={styles.spinner}
          />
          <Text style={styles.loadingText}>Getting ready...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.navy[900],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: designTokens.spacing['4xl'],
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: designTokens.borderRadius['2xl'],
    backgroundColor: designTokens.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
    ...designTokens.shadows.lg,
  },
  logoText: {
    fontSize: designTokens.typography.fontSize['4xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.inverse,
  },
  brandName: {
    fontSize: designTokens.typography.fontSize['3xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.inverse,
    marginBottom: designTokens.spacing.sm,
  },
  tagline: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.normal,
    color: designTokens.colors.navy[300],
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.lg,
  },
  footer: {
    position: 'absolute',
    bottom: designTokens.spacing['4xl'],
    alignItems: 'center',
  },
  spinner: {
    marginBottom: designTokens.spacing.md,
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.navy[400],
    fontWeight: designTokens.typography.fontWeight.medium,
  },
});