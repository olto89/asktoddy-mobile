import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import designTokens from '../styles/designTokens';
import { AppIcons, IconSize } from '../styles/iconRegistry';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface Props {
  navigation: any;
}

export default function ResetPasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to update password. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <View style={styles.branding}>
            <View style={styles.logoRow}>
              <Ionicons
                name={AppIcons.brand}
                size={IconSize.large}
                color={designTokens.colors.primary[600]}
              />
              <Text style={styles.logo}>AskToddy</Text>
            </View>
            <Text style={styles.title}>{success ? 'Password Updated' : 'Create New Password'}</Text>
            <Text style={styles.subtitle}>
              {success
                ? 'Your password has been updated successfully.'
                : 'Enter your new password below.'}
            </Text>
          </View>

          {success ? (
            <Card style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={48}
                  color={designTokens.colors.success[500]}
                />
              </View>
              <Text style={styles.successTitle}>All Done!</Text>
              <Text style={styles.successText}>
                Your password has been reset. You can now use your new password to sign in.
              </Text>
              <Button
                title="Continue to App"
                onPress={() => navigation.navigate('Main')}
                variant="primary"
                style={styles.submitButton}
              />
            </Card>
          ) : (
            <Card style={styles.formCard}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 characters"
                placeholderTextColor={designTokens.colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                autoFocus
                editable={!loading}
              />

              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={designTokens.colors.text.tertiary}
                secureTextEntry
                autoComplete="new-password"
                editable={!loading}
              />

              <Button
                title={loading ? '' : 'Reset Password'}
                onPress={handleResetPassword}
                variant="primary"
                style={styles.submitButton}
                disabled={loading}
                icon={loading ? <ActivityIndicator color="white" size="small" /> : undefined}
              />
            </Card>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.lg,
    justifyContent: 'center',
    marginTop: -60,
  },
  branding: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.xl,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.md,
  },
  logo: {
    fontSize: designTokens.typography.fontSize['3xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
  },
  title: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    padding: designTokens.spacing.lg,
  },
  successCard: {
    padding: designTokens.spacing.lg,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: designTokens.spacing.md,
  },
  successTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  successText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: designTokens.spacing.lg,
  },
  fieldLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.xs,
    marginTop: designTokens.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.lg,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    backgroundColor: 'white',
    marginBottom: designTokens.spacing.sm,
  },
  submitButton: {
    marginTop: designTokens.spacing.lg,
    width: '100%',
  },
});
