import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    <LinearGradient
      colors={['#FF6B35', '#FF8C42']} // Same gradient as ToddyHeader
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Toddy Character Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.characterContainer}>
              <Image
                source={require('../../assets/characters/toddy-character.png')}
                style={styles.characterImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>AskToddy</Text>
            <Text style={styles.tagline}>AI-powered construction quotes</Text>
          </View>

          <View style={styles.footer}>
            <ActivityIndicator
              size="large"
              color={designTokens.colors.text.inverse}
              style={styles.spinner}
            />
            <Text style={styles.loadingText}>Getting ready...</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let gradient show through
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
  characterContainer: {
    width: 160,
    height: 160,
    borderRadius: designTokens.borderRadius['3xl'],
    backgroundColor: designTokens.colors.text.inverse,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing['2xl'],
    ...designTokens.shadows.xl,
    padding: designTokens.spacing.lg,
  },
  characterImage: {
    width: 120,
    height: 120,
  },
  brandName: {
    fontSize: designTokens.typography.fontSize['5xl'], // Larger text
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.inverse,
    marginBottom: designTokens.spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.primary[100], // Light orange for contrast
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.xl,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.primary[100],
    fontWeight: designTokens.typography.fontWeight.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
