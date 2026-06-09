import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authHelpers } from '../services/supabase';
import designTokens from '../styles/designTokens';
import { logger } from '../services/Logger';

interface Props {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function AppleSignInButton({ onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);

  // Only render on iOS
  if (Platform.OS !== 'ios') return null;

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple');
      }

      const { data, error } = await authHelpers.signInWithApple(credential.identityToken);

      if (error) {
        throw error;
      }

      // If Apple provided a name (only on first sign-in), we could store it
      if (credential.fullName?.givenName) {
        logger.debug(
          `Apple provided name: ${credential.fullName.givenName} ${credential.fullName.familyName || ''}`
        );
      }

      logger.debug('Apple Sign-In successful');
      onSuccess?.();
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled — not an error
        return;
      }
      logger.warn('Apple Sign-In error:', error);
      Alert.alert('Sign In Failed', error.message || 'Could not sign in with Apple.');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingButton}>
          <ActivityIndicator size="small" color="white" />
        </View>
      ) : (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={designTokens.borderRadius.lg}
          style={styles.appleButton}
          onPress={handleAppleSignIn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: designTokens.spacing.md,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  loadingButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#000',
    borderRadius: designTokens.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
