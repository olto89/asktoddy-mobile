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
import { logger } from '../services/Logger';
import { useNavigation } from '@react-navigation/native';
import { useImagePicker } from '../hooks/useImagePicker';
import * as ImageManipulator from 'expo-image-manipulator';
import designTokens from '../styles/designTokens';
import { AppIcons } from '../styles/iconRegistry';
import { DEFAULT_QUOTE_VALIDITY_DAYS, DEFAULT_LEGAL_NOTICE } from '../constants/quoteDefaults';
import UpgradePromptModal from '../components/modals/UpgradePromptModal';

export default function AccountScreen() {
  const { user, signOut, deleteAccount, freemiumUser, updateCompanyProfile, isPremium } = useAuth();
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

  // Premium quote settings state
  const [quoteValidityDays, setQuoteValidityDays] = useState(
    String(freemiumUser.quoteValidityDays ?? DEFAULT_QUOTE_VALIDITY_DAYS)
  );
  const [businessAddress, setBusinessAddress] = useState(freemiumUser.businessAddress || '');
  const [businessPhone, setBusinessPhone] = useState(freemiumUser.businessPhone || '');
  const [businessEmail, setBusinessEmail] = useState(freemiumUser.businessEmail || '');
  const [businessWebsite, setBusinessWebsite] = useState(freemiumUser.businessWebsite || '');
  const [legalNotice, setLegalNotice] = useState(freemiumUser.legalNotice || DEFAULT_LEGAL_NOTICE);
  const [savingQuoteSettings, setSavingQuoteSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Inline "Saved!" acknowledgement timers
  const [nameSaved, setNameSaved] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const [quoteSettingsSaved, setQuoteSettingsSaved] = useState(false);
  const nameSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quoteSettingsSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showQuoteSettingsSaved = () => {
    setQuoteSettingsSaved(true);
    if (quoteSettingsSavedTimer.current) clearTimeout(quoteSettingsSavedTimer.current);
    quoteSettingsSavedTimer.current = setTimeout(() => setQuoteSettingsSaved(false), 2500);
  };

  const { pickFromLibrary } = useImagePicker({
    aspect: [1, 1],
    quality: 0.8,
    onImageSelected: async (uri: string) => {
      try {
        setUploadingLogo(true);

        // RLS scopes uploads to the user's own folder ({uid}/*), so a logged-in
        // session is required. Bail clearly rather than uploading to "undefined/".
        if (!user?.id) {
          Alert.alert('Sign in needed', 'Please sign in again to upload your logo.');
          return;
        }

        // Convert any format (HEIC, WEBP, PNG, etc.) to JPEG for consistent
        // storage. Request base64 so we upload exactly what the manipulator
        // produced — avoids a second file read of a camera-roll asset that can
        // come back empty on iOS.
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 512 } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (!manipulated?.uri) {
          throw new Error('Image processing returned no file');
        }

        const logoPath = `${user.id}/logo.jpg`;
        // Delete any old PNG version to avoid stale files
        await dbHelpers.deleteStorageFile('company-logos', `${user.id}/logo.png`).catch(() => {});
        const result = await dbHelpers.uploadImage(
          manipulated.uri,
          logoPath,
          'company-logos',
          manipulated.base64
        );
        if (result.error) throw result.error;
        await updateCompanyProfile({ companyLogoUrl: result.data!.publicUrl });
        showLogoSaved();
      } catch (err: any) {
        // Surface the real reason — previously this was swallowed behind a
        // generic message, leaving RLS denials / read failures undiagnosable.
        logger.error('Logo upload failed:', err);
        const reason =
          err?.message || err?.error_description || err?.error || 'Please try a different image.';
        Alert.alert('Upload Failed', `Could not save your logo. ${reason}`);
      } finally {
        setUploadingLogo(false);
      }
    },
  });

  const handleSaveCompanyName = async () => {
    try {
      setSavingName(true);
      await updateCompanyProfile({ companyName });
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
      // Clean up both possible extensions (jpg and png)
      await dbHelpers.deleteStorageFile('company-logos', `${user?.id}/logo.jpg`);
      await dbHelpers.deleteStorageFile('company-logos', `${user?.id}/logo.png`);
      await updateCompanyProfile({ companyLogoUrl: null });
      showLogoSaved();
    } catch (err) {
      Alert.alert('Error', 'Failed to remove logo. Please try again.');
    } finally {
      setRemovingLogo(false);
    }
  };

  const handleSaveQuoteSettings = async () => {
    try {
      setSavingQuoteSettings(true);
      const days = parseInt(quoteValidityDays, 10);
      await updateCompanyProfile({
        quoteValidityDays: isNaN(days) ? DEFAULT_QUOTE_VALIDITY_DAYS : days,
        businessAddress,
        businessPhone,
        businessEmail,
        businessWebsite,
        legalNotice,
      });
      showQuoteSettingsSaved();
    } catch (err) {
      Alert.alert('Error', 'Failed to save quote settings. Please try again.');
    } finally {
      setSavingQuoteSettings(false);
    }
  };

  const handlePremiumFieldPress = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
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

          {/* Edit Profile — removed pending implementation */}

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
              <Text style={styles.logoHintText}>
                Select a PNG or JPEG image from your photo library
              </Text>
              <View style={styles.brandingLogoRow}>
                <TouchableOpacity
                  style={styles.logoContainer}
                  onPress={pickFromLibrary}
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
                    onPress={pickFromLibrary}
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

              {/* Premium Quote Settings */}
              <View style={styles.premiumDivider} testID="premium-quote-settings-section">
                <View style={styles.premiumSectionHeader}>
                  <Text style={styles.premiumSectionLabel}>Premium Quote Settings</Text>
                  {!isPremium && (
                    <View style={styles.premiumBadge} testID="pro-badge">
                      <Text style={styles.premiumBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>

                {/* Quote Validity Days */}
                <Text style={styles.brandingLabel}>Quote Validity (days)</Text>
                <TouchableOpacity
                  onPress={handlePremiumFieldPress}
                  disabled={isPremium}
                  activeOpacity={isPremium ? 1 : 0.7}
                >
                  <TextInput
                    style={[styles.brandingInput, !isPremium && styles.lockedInput]}
                    value={quoteValidityDays}
                    onChangeText={setQuoteValidityDays}
                    keyboardType="numeric"
                    editable={isPremium}
                    placeholder={String(DEFAULT_QUOTE_VALIDITY_DAYS)}
                    placeholderTextColor={designTokens.colors.text.tertiary}
                    testID="quote-validity-input"
                  />
                </TouchableOpacity>

                {/* Business Address */}
                <Text style={[styles.brandingLabel, { marginTop: designTokens.spacing.md }]}>
                  Business Address
                </Text>
                <TouchableOpacity
                  onPress={handlePremiumFieldPress}
                  disabled={isPremium}
                  activeOpacity={isPremium ? 1 : 0.7}
                >
                  <TextInput
                    style={[
                      styles.brandingInput,
                      !isPremium && styles.lockedInput,
                      { minHeight: 60, textAlignVertical: 'top' },
                    ]}
                    value={businessAddress}
                    onChangeText={setBusinessAddress}
                    editable={isPremium}
                    multiline
                    placeholder="Enter business address"
                    placeholderTextColor={designTokens.colors.text.tertiary}
                    testID="business-address-input"
                  />
                </TouchableOpacity>

                {/* Business Phone */}
                <Text style={[styles.brandingLabel, { marginTop: designTokens.spacing.md }]}>
                  Phone
                </Text>
                <TouchableOpacity
                  onPress={handlePremiumFieldPress}
                  disabled={isPremium}
                  activeOpacity={isPremium ? 1 : 0.7}
                >
                  <TextInput
                    style={[styles.brandingInput, !isPremium && styles.lockedInput]}
                    value={businessPhone}
                    onChangeText={setBusinessPhone}
                    editable={isPremium}
                    keyboardType="phone-pad"
                    placeholder="Enter phone number"
                    placeholderTextColor={designTokens.colors.text.tertiary}
                    testID="business-phone-input"
                  />
                </TouchableOpacity>

                {/* Business Email */}
                <Text style={[styles.brandingLabel, { marginTop: designTokens.spacing.md }]}>
                  Email
                </Text>
                <TouchableOpacity
                  onPress={handlePremiumFieldPress}
                  disabled={isPremium}
                  activeOpacity={isPremium ? 1 : 0.7}
                >
                  <TextInput
                    style={[styles.brandingInput, !isPremium && styles.lockedInput]}
                    value={businessEmail}
                    onChangeText={setBusinessEmail}
                    editable={isPremium}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Enter email address"
                    placeholderTextColor={designTokens.colors.text.tertiary}
                    testID="business-email-input"
                  />
                </TouchableOpacity>

                {/* Business Website */}
                <Text style={[styles.brandingLabel, { marginTop: designTokens.spacing.md }]}>
                  Website
                </Text>
                <TouchableOpacity
                  onPress={handlePremiumFieldPress}
                  disabled={isPremium}
                  activeOpacity={isPremium ? 1 : 0.7}
                >
                  <TextInput
                    style={[styles.brandingInput, !isPremium && styles.lockedInput]}
                    value={businessWebsite}
                    onChangeText={setBusinessWebsite}
                    editable={isPremium}
                    keyboardType="url"
                    autoCapitalize="none"
                    placeholder="Enter website URL"
                    placeholderTextColor={designTokens.colors.text.tertiary}
                    testID="business-website-input"
                  />
                </TouchableOpacity>

                {/* Legal Notice */}
                <Text style={[styles.brandingLabel, { marginTop: designTokens.spacing.md }]}>
                  Legal Notice / Terms
                </Text>
                <TouchableOpacity
                  onPress={handlePremiumFieldPress}
                  disabled={isPremium}
                  activeOpacity={isPremium ? 1 : 0.7}
                >
                  <TextInput
                    style={[
                      styles.brandingInput,
                      styles.legalInput,
                      !isPremium && styles.lockedInput,
                    ]}
                    value={legalNotice}
                    onChangeText={setLegalNotice}
                    editable={isPremium}
                    multiline
                    numberOfLines={6}
                    placeholder="Enter legal terms and conditions"
                    placeholderTextColor={designTokens.colors.text.tertiary}
                    testID="legal-notice-input"
                  />
                </TouchableOpacity>

                {/* Save Quote Settings Button */}
                {isPremium && (
                  <TouchableOpacity
                    style={[
                      styles.changePasswordButton,
                      { marginTop: designTokens.spacing.md },
                      savingQuoteSettings && styles.changePasswordButtonDisabled,
                    ]}
                    onPress={handleSaveQuoteSettings}
                    disabled={savingQuoteSettings}
                    testID="save-quote-settings-button"
                  >
                    {savingQuoteSettings ? (
                      <ActivityIndicator size="small" color={designTokens.colors.text.inverse} />
                    ) : (
                      <Text style={styles.changePasswordButtonText}>Save Quote Settings</Text>
                    )}
                  </TouchableOpacity>
                )}
                {quoteSettingsSaved && (
                  <Text style={styles.savedText} testID="quote-settings-saved-indicator">
                    Saved!
                  </Text>
                )}
              </View>
            </View>
          )}

          <UpgradePromptModal
            visible={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            reason="premium_feature"
          />

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
  logoHintText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    marginBottom: designTokens.spacing.sm,
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
  premiumDivider: {
    marginTop: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.border.primary,
  },
  premiumSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
    gap: designTokens.spacing.sm,
  },
  premiumSectionLabel: {
    fontSize: designTokens.typography.fontSize.md,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  premiumBadge: {
    backgroundColor: designTokens.colors.primary[500],
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: designTokens.borderRadius.sm,
  },
  premiumBadgeText: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.inverse,
  },
  lockedInput: {
    backgroundColor: designTokens.colors.background.secondary,
    opacity: 0.7,
  },
  legalInput: {
    minHeight: 120,
    textAlignVertical: 'top' as any,
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
