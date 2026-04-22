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
import { authHelpers } from '../services/supabase';
import designTokens from '../styles/designTokens';
import { AppIcons, IconSize } from '../styles/iconRegistry';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface Props {
  navigation: any;
  route: any;
}

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const prefillEmail = route.params?.email || '';
  const [email, setEmail] = useState(prefillEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();

    if (!trimmed) {
      Alert.alert('Enter Email', 'Please enter the email address associated with your account.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await authHelpers.resetPassword(trimmed);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
      } else {
        setSent(true);
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
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={designTokens.colors.text.primary} />
        </TouchableOpacity>

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
            <Text style={styles.title}>{sent ? 'Check Your Email' : 'Reset Password'}</Text>
            <Text style={styles.subtitle}>
              {sent
                ? `We've sent a password reset link to`
                : "Enter your email address and we'll send you a link to reset your password."}
            </Text>
            {sent && <Text style={styles.emailHighlight}>{email.trim()}</Text>}
          </View>

          {sent ? (
            <Card style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={48}
                  color={designTokens.colors.success[500]}
                />
              </View>
              <Text style={styles.successTitle}>Reset Link Sent</Text>
              <Text style={styles.successText}>
                Check your inbox and click the link to create a new password. The link will expire
                in 24 hours.
              </Text>
              <Button
                title="Back to Sign In"
                onPress={() => navigation.goBack()}
                variant="primary"
                style={styles.submitButton}
              />
            </Card>
          ) : (
            <Card style={styles.formCard}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={designTokens.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus={!prefillEmail}
                editable={!loading}
              />

              <Button
                title={loading ? '' : 'Send Reset Link'}
                onPress={handleSubmit}
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
  backButton: {
    padding: designTokens.spacing.lg,
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
  emailHighlight: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.primary[600],
    marginTop: designTokens.spacing.xs,
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
