/**
 * AccountScreen - User account management and logout functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import designTokens from '../styles/designTokens';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        Alert.alert('Error', error.message || 'Failed to update password.');
      } else {
        Alert.alert('Success', 'Your password has been updated.');
        setShowChangePassword(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            // Navigation will be handled automatically by AuthNavigator
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={designTokens.colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userEmail}>{user?.email || 'Unknown'}</Text>
              <Text style={styles.userSubtext}>
                Member since{' '}
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Coming Soon', 'Profile management coming in next update!')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="person-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Change Password</Text>
            </View>
            <Ionicons
              name={showChangePassword ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={designTokens.colors.text.tertiary}
            />
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.changePasswordForm}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New password (min 6 characters)"
                placeholderTextColor={designTokens.colors.text.tertiary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm new password"
                placeholderTextColor={designTokens.colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={[
                  styles.changePasswordButton,
                  changingPassword && styles.changePasswordButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color={designTokens.colors.text.inverse} />
                ) : (
                  <Text style={styles.changePasswordButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('Coming Soon', 'Notification settings coming in next update!')
            }
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Help', 'Contact support at support@asktoddy.com')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('App Info', 'AskToddy v1.0.1\nYour construction cost expert')
            }
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>About AskToddy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityLabel="Logout"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color={designTokens.colors.text.inverse} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.navy[900],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.primary[500],
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.primary[600],
  },
  backButton: {
    padding: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.md,
  },
  headerTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.inverse,
  },
  headerRight: {
    width: 32, // Same width as back button for centering
  },
  content: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
  },
  section: {
    backgroundColor: designTokens.colors.background.secondary,
    marginTop: designTokens.spacing.md,
    marginHorizontal: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: designTokens.spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: designTokens.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.inverse,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  userSubtext: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border.primary,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: designTokens.typography.fontSize.md,
    color: designTokens.colors.text.primary,
    marginLeft: designTokens.spacing.md,
  },
  changePasswordForm: {
    paddingTop: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.xs,
  },
  passwordInput: {
    backgroundColor: designTokens.colors.background.primary,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.md,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.md,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  changePasswordButton: {
    backgroundColor: designTokens.colors.primary[500],
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
    alignItems: 'center',
    marginTop: designTokens.spacing.xs,
  },
  changePasswordButtonDisabled: {
    opacity: 0.6,
  },
  changePasswordButtonText: {
    fontSize: designTokens.typography.fontSize.md,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.inverse,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designTokens.colors.error[500],
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
  },
  logoutButtonText: {
    fontSize: designTokens.typography.fontSize.md,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.inverse,
    marginLeft: designTokens.spacing.sm,
  },
  bottomSpacing: {
    height: 40,
  },
});
