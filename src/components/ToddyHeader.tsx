/**
 * ToddyHeader - Orange gradient header matching AskToddy POC design
 * Features: Toddy character, gradient background, menu button
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import designTokens from '../styles/designTokens';

interface ToddyHeaderProps {
  onMenuPress?: () => void;
  showMenuButton?: boolean;
}

export default function ToddyHeader({ onMenuPress, showMenuButton = true }: ToddyHeaderProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FF6B35', '#FF8C42']} // Toddy Orange gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            {/* Toddy Character Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>T</Text>
              {/* TODO: Replace with actual Toddy character image */}
              {/* <Image source={require('../../assets/toddy-character.png')} style={styles.avatarImage} /> */}
            </View>
            
            {/* Brand Text */}
            <View style={styles.brandText}>
              <Text style={styles.title}>AskToddy</Text>
              <Text style={styles.subtitle}>Your Construction Expert</Text>
            </View>
          </View>

          {/* Menu Button */}
          {showMenuButton && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onMenuPress}
              accessibilityLabel="Open menu"
              accessibilityRole="button"
            >
              <Ionicons name="menu" size={24} color="rgba(255, 255, 255, 0.9)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: designTokens.colors.primary[500], // Fallback color
  },
  header: {
    // LinearGradient component handles the orange gradient
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarText: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.primary[500],
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  brandText: {
    flex: 1,
  },
  title: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.inverse,
    lineHeight: designTokens.typography.lineHeight.xl,
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: designTokens.typography.fontWeight.medium,
    marginTop: 1,
  },
  menuButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});