/**
 * AccountScreen - User account management and logout functionality
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase, dbHelpers } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { useImagePicker } from '../hooks/useImagePicker';
import designTokens from '../styles/designTokens';
import { AppIcons } from '../styles/iconRegistry';

export default function AccountScreen() {
  const { user, signOut, deleteAccount, freemiumUser, updateCompanyProfile } = useAuth();
  const navigation = useNavigation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Company branding state
  const [showCompanyBranding, setShowCompanyBranding] = useState(false);
  const [companyName, setCompanyName] = useState(freemiumUser.companyName || '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);

  // Inline "Saved!" acknowledgement timers
  const [nameSaved, setNameSaved] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const nameSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNameSaved = () => {
    setNameSaved(true);
    if (nameSavedTimer.current) clearTimeout(nameSavedTimer.current);
    nameSavedTimer.current = setTimeout(() => setNameSaved(false), 2500);
  };

  const showLogoSaved = () => {
    setLogoSaved(true);
    if (logoSavedTimer.current) clearTimeout(logoSavedTimer.current);
    logoSavedTimer.current = setTimeout(() => setLogoSaved(false), 2500);
  };

  const { showImagePicker } = useImagePicker({
    aspect: [1, 1],
    quality: 0.8,
    onImageSelected: async (uri: string) => {
      try {
        setUploadingLogo(true);
        const logoPath = `${user?.id}/logo.jpg`;
        const result = await dbHelpers.uploadImage(uri, logoPath, 'company-logos');
        if (result.error) throw result.error;
        await updateCompanyProfile(undefined, result.data!.publicUrl);
        showLogoSaved();
      } catch (err) {
        Alert.alert('Error', 'Failed to upload logo. Please try again.');
      } finally {
        setUploadingLogo(false);
      }
    },
  });

  const handleSaveCompanyName = async () => {
    try {
      setSavingName(true);
      await updateCompanyProfile(companyName);
      showNameSaved();
    } catch (err) {
      Alert.alert('Error', 'Failed to save company name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setRemovingLogo(true);
      const logoPath = `${user?.id}/logo.jpg`;
      await dbHelpers.deleteStorageFile('company-logos', logoPath);
      await updateCompanyProfile(undefined, null);
      showLogoSaved();
    } catch (err) {
      Alert.alert('Error', 'Failed to remove logo. Please try again.');
    } finally {
      setRemovingLogo(false);
    }
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccount(true);
              await deleteAccount();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete account. Please try again.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>My Account</Text>
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

          {/* Company Branding */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowCompanyBranding(!showCompanyBranding)}
            testID="company-branding-toggle"
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={AppIcons.companyBranding}
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Company Branding</Text>
            </View>
            <Ionicons
              name={showCompanyBranding ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={designTokens.colors.text.tertiary}
            />
          </TouchableOpacity>

          {showCompanyBranding && (
            <View style={styles.brandingForm} testID="company-branding-section">
              {/* Company Name */}
              <Text style={styles.brandingLabel}>Company Name</Text>
              <View style={styles.brandingNameRow}>
                <TextInput
                  style={styles.brandingInput}
                  placeholder="Enter company name"
                  placeholderTextColor={designTokens.colors.text.tertiary}
                  value={companyName}
                  onChangeText={setCompanyName}
                  testID="company-name-input"
                />
                <TouchableOpacity
                  style={[
                    styles.brandingSaveButton,
                    savingName && styles.changePasswordButtonDisabled,
                  ]}
                  onPress={handleSaveCompanyName}
                  disabled={savingName}
                  testID="save-company-name-button"
                >
                  {savingName ? (
                    <ActivityIndicator size="small" color={designTokens.colors.text.inverse} />
                  ) : (
                    <Text style={styles.changePasswordButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
                {nameSaved && (
                  <Text style={styles.savedText} testID="name-saved-indicator">
                    Saved!
                  </Text>
                )}
              </View>

              {/* Company Logo */}
              <Text style={[styles.brandingLabel, { marginTop: designTokens.spacing.md }]}>
                Company Logo
              </Text>
              <View style={styles.brandingLogoRow}>
                <TouchableOpacity
                  style={styles.logoContainer}
                  onPress={showImagePicker}
                  disabled={uploadingLogo}
                  testID="logo-picker-button"
                >
                  {uploadingLogo ? (
                    <ActivityIndicator size="large" color={designTokens.colors.primary[500]} />
                  ) : freemiumUser.companyLogoUrl ? (
                    <Image
                      source={{ uri: freemiumUser.companyLogoUrl }}
                      style={styles.logoImage}
                      testID="company-logo-image"
                    />
                  ) : (
                    <Ionicons
                      name={AppIcons.companyLogo}
                      size={32}
                      color={designTokens.colors.text.tertiary}
                    />
                  )}
                </TouchableOpacity>
                <View style={styles.logoActions}>
                  <TouchableOpacity
                    style={styles.logoActionButton}
                    onPress={showImagePicker}
                    disabled={uploadingLogo}
                  >
                    <Text style={styles.logoActionText}>
                      {freemiumUser.companyLogoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Text>
                  </TouchableOpacity>
                  {freemiumUser.companyLogoUrl && (
                    <TouchableOpacity
                      style={styles.logoActionButton}
                      onPress={handleRemoveLogo}
                      disabled={removingLogo}
                      testID="remove-logo-button"
                    >
                      {removingLogo ? (
                        <ActivityIndicator size="small" color={designTokens.colors.error[500]} />
                      ) : (
                        <Text
                          style={[styles.logoActionText, { color: designTokens.colors.error[500] }]}
                        >
                          Remove Logo
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {logoSaved && (
                <Text style={styles.savedText} testID="logo-saved-indicator">
                  Saved!
                </Text>
              )}
            </View>
          )}

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
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            testID="delete-account-button"
          >
            <View style={styles.menuItemLeft}>
              {deletingAccount ? (
                <ActivityIndicator size="small" color={designTokens.colors.error[500]} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={designTokens.colors.error[500]} />
              )}
              <Text style={[styles.menuItemText, { color: designTokens.colors.error[500] }]}>
                Delete Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={designTokens.colors.error[500]} />
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => (navigation as any).navigate('PrivacyPolicy')}
            testID="privacy-policy-link"
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={designTokens.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => (navigation as any).navigate('Terms')}
            testID="terms-link"
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Terms & Conditions</Text>
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
    backgroundColor: designTokens.colors.primary[500],
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
  brandingForm: {
    paddingTop: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.xs,
  },
  brandingLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.xs,
  },
  brandingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  brandingInput: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.md,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.md,
    color: designTokens.colors.text.primary,
  },
  brandingSaveButton: {
    backgroundColor: designTokens.colors.primary[500],
    paddingVertical: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  brandingLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: designTokens.colors.background.primary,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: designTokens.borderRadius.lg,
  },
  logoActions: {
    flex: 1,
    gap: designTokens.spacing.xs,
  },
  logoActionButton: {
    paddingVertical: designTokens.spacing.xs,
  },
  logoActionText: {
    fontSize: designTokens.typography.fontSize.md,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  savedText: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: (designTokens.colors as any).success || '#22c55e',
    marginTop: designTokens.spacing.xs,
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
