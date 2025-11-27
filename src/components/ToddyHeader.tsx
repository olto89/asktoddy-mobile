/**
 * ToddyHeader - Orange gradient header matching AskToddy POC design
 * Features: Toddy character, gradient background, menu button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import designTokens from '../styles/designTokens';

interface ToddyHeaderProps {
  onMenuPress?: () => void;
  onNewChatPress?: () => void;
  showMenuButton?: boolean;
  showNewChatButton?: boolean;
}

export default function ToddyHeader({
  onMenuPress,
  onNewChatPress,
  showMenuButton = true,
  showNewChatButton = true,
}: ToddyHeaderProps) {
  return (
    <LinearGradient
      colors={['#FF6B35', '#FF8C42']} // Toddy Orange gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.fullContainer}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.content}>
            <View style={styles.leftSection}>
              {/* Toddy Character Avatar */}
              <View style={styles.avatar}>
                <Image
                  source={require('../../assets/characters/toddy-character.png')}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </View>

              {/* Brand Text */}
              <View style={styles.brandText}>
                <Text style={styles.title}>AskToddy</Text>
                <Text style={styles.subtitle}>Your Construction Expert</Text>
              </View>
            </View>

            {/* Right side buttons */}
            <View style={styles.rightSection}>
              {showNewChatButton && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={onNewChatPress}
                  accessibilityLabel="New conversation"
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={24} color="rgba(255, 255, 255, 0.9)" />
                </TouchableOpacity>
              )}

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
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    // LinearGradient fills entire header including status bar
  },
  container: {
    backgroundColor: 'transparent', // Let gradient show through
  },
  header: {
    // No background color needed - gradient handles it
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
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    minHeight: 68,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarText: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.primary[500],
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  headerButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  menuButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
});
