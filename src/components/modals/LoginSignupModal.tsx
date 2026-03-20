import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { navigate } from '../../services/NavigationService';
import designTokens from '../../styles/designTokens';
import { AppIcons, IconSize } from '../../styles/iconRegistry';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface LoginSignupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'login' | 'signup';
  title?: string;
  subtitle?: string;
}

export default function LoginSignupModal({
  visible,
  onClose,
  onSuccess,
  mode: initialMode = 'signup',
  title = 'Sign Up Free',
  subtitle = 'Get 5 free AI quotes per month',
}: LoginSignupModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const { signIn, signUp, isAuthenticated } = useAuth();

  // Auto-close modal when user becomes authenticated (e.g., after email verification deep link)
  useEffect(() => {
    if (visible && isAuthenticated && verificationPending) {
      console.log('✅ User authenticated while verification pending — closing modal');
      handleClose();
      onSuccess?.();
    }
  }, [isAuthenticated, visible, verificationPending]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
    setVerificationPending(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error, needsVerification } = await signUp(email.trim(), password);

        if (error) {
          Alert.alert('Sign Up Error', error.message || 'Failed to create account');
        } else if (needsVerification) {
          // Show verification pending UI within the modal instead of closing
          setVerificationPending(true);
        } else {
          // Successful signup without verification - close modal immediately and continue
          handleClose();
          onSuccess?.();
        }
      } else {
        const { error } = await signIn(email.trim(), password);

        if (error) {
          if (error.code === 'EMAIL_NOT_CONFIRMED') {
            Alert.alert(
              'Email Not Verified',
              'Please check your email and click the verification link before signing in.'
            );
          } else {
            Alert.alert('Sign In Error', error.message || 'Failed to sign in');
          }
        } else {
          // Successful sign in - wait for auth state to fully propagate
          console.log('✅ Sign in successful, waiting for auth state...');
          setTimeout(() => {
            handleClose();
            onSuccess?.();
          }, 1500); // Longer delay for Expo Go stability
        }
      }
    } catch (error) {
      console.error(`${mode} error:`, error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Close the modal and navigate to the dedicated ForgotPassword screen
    handleClose();
    navigate('ForgotPassword', { email: email.trim() || undefined });
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                testID="close-modal-button"
              >
                <Ionicons name="close" size={24} color={designTokens.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {verificationPending ? (
                // Verification pending UI - stays in modal until user verifies
                <View style={styles.verificationContainer}>
                  <View style={styles.branding}>
                    <View style={styles.logoRow}>
                      <Ionicons
                        name={AppIcons.brand}
                        size={IconSize.large}
                        color={designTokens.colors.primary[600]}
                      />
                      <Text style={styles.logo}>AskToddy</Text>
                    </View>
                    <Text style={styles.title}>Check Your Email</Text>
                    <Text style={styles.subtitle}>
                      We've sent a verification link to{'\n'}
                      <Text style={{ fontWeight: '600' }}>{email}</Text>
                    </Text>
                  </View>

                  <Card style={styles.benefitsCard}>
                    <View style={styles.benefitsTitleRow}>
                      <Ionicons
                        name={AppIcons.nextSteps}
                        size={IconSize.small}
                        color={designTokens.colors.text.primary}
                      />
                      <Text style={styles.benefitsTitle}>Next Steps:</Text>
                    </View>
                    <View style={styles.benefit}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={designTokens.colors.primary[500]}
                      />
                      <Text style={styles.benefitText}>Open the email we just sent</Text>
                    </View>
                    <View style={styles.benefit}>
                      <Ionicons
                        name="link-outline"
                        size={20}
                        color={designTokens.colors.primary[500]}
                      />
                      <Text style={styles.benefitText}>Click the verification link</Text>
                    </View>
                    <View style={styles.benefit}>
                      <Ionicons
                        name="log-in-outline"
                        size={20}
                        color={designTokens.colors.primary[500]}
                      />
                      <Text style={styles.benefitText}>Come back and sign in</Text>
                    </View>
                  </Card>

                  <Button
                    title="I've Verified - Sign In"
                    onPress={() => {
                      setVerificationPending(false);
                      setMode('login');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    variant="primary"
                    style={styles.submitButton}
                  />
                  <TouchableOpacity onPress={handleClose} style={styles.switchMode}>
                    <Text style={styles.switchModeText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Branding */}
                  <View style={styles.branding}>
                    <View style={styles.logoRow}>
                      <Ionicons
                        name={AppIcons.brand}
                        size={IconSize.large}
                        color={designTokens.colors.primary[600]}
                      />
                      <Text style={styles.logo}>AskToddy</Text>
                    </View>
                    <Text style={styles.title}>{mode === 'signup' ? title : 'Welcome Back'}</Text>
                    <Text style={styles.subtitle}>
                      {mode === 'signup' ? subtitle : 'Sign in to continue generating quotes'}
                    </Text>
                  </View>

                  {/* Benefits for signup */}
                  {mode === 'signup' && (
                    <Card style={styles.benefitsCard}>
                      <View style={styles.benefitsTitleRow}>
                        <Ionicons
                          name={AppIcons.freeIncludes}
                          size={IconSize.small}
                          color={designTokens.colors.primary[500]}
                        />
                        <Text style={styles.benefitsTitle}>Free Account Includes:</Text>
                      </View>
                      <View style={styles.benefit}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={designTokens.colors.success[500]}
                        />
                        <Text style={styles.benefitText}>5 AI-generated quotes per month</Text>
                      </View>
                      <View style={styles.benefit}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={designTokens.colors.success[500]}
                        />
                        <Text style={styles.benefitText}>Save and manage your quotes</Text>
                      </View>
                      <View style={styles.benefit}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={designTokens.colors.success[500]}
                        />
                        <Text style={styles.benefitText}>Accurate UK construction pricing</Text>
                      </View>
                    </Card>
                  )}

                  {/* Form */}
                  <Card style={styles.formCard}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor={designTokens.colors.text.tertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />

                    <Text style={styles.fieldLabel}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password (min 6 characters)"
                      placeholderTextColor={designTokens.colors.text.tertiary}
                      secureTextEntry
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />

                    {mode === 'signup' && (
                      <>
                        <Text style={styles.fieldLabel}>Confirm Password</Text>
                        <TextInput
                          style={styles.input}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          placeholder="Confirm password"
                          placeholderTextColor={designTokens.colors.text.tertiary}
                          secureTextEntry
                          autoComplete="new-password"
                        />
                      </>
                    )}

                    <Button
                      title={loading ? '' : mode === 'signup' ? 'Sign Up Free' : 'Sign In'}
                      onPress={handleSubmit}
                      variant="primary"
                      style={styles.submitButton}
                      disabled={loading}
                      icon={loading ? <ActivityIndicator color="white" size="small" /> : undefined}
                    />

                    {mode === 'login' && (
                      <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={handleForgotPassword}
                      >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                      </TouchableOpacity>
                    )}
                  </Card>

                  {/* Switch mode */}
                  <TouchableOpacity onPress={switchMode} style={styles.switchMode}>
                    <Text style={styles.switchModeText}>
                      {mode === 'signup'
                        ? 'Already have an account? Sign In'
                        : "Don't have an account? Sign Up Free"}
                    </Text>
                  </TouchableOpacity>

                  {/* Privacy note */}
                  {mode === 'signup' && (
                    <Text style={styles.privacyNote}>
                      By signing up, you agree to our{' '}
                      <Text
                        style={styles.privacyLink}
                        onPress={() => {
                          handleClose();
                          navigate('Terms');
                        }}
                      >
                        Terms of Service
                      </Text>{' '}
                      and{' '}
                      <Text
                        style={styles.privacyLink}
                        onPress={() => {
                          handleClose();
                          navigate('PrivacyPolicy');
                        }}
                      >
                        Privacy Policy
                      </Text>
                    </Text>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
  },
  closeButton: {
    padding: designTokens.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xl,
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
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
  benefitsCard: {
    marginBottom: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.primary[25],
    borderColor: designTokens.colors.primary[200],
  },
  benefitsTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.md,
  },
  benefitsTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
  },
  benefitText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  formCard: {
    padding: designTokens.spacing.lg,
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
  },
  forgotPassword: {
    alignItems: 'center' as const,
    marginTop: designTokens.spacing.md,
  },
  forgotPasswordText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  switchMode: {
    alignSelf: 'center',
    padding: designTokens.spacing.md,
  },
  switchModeText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.primary[600],
    textAlign: 'center',
  },
  privacyNote: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: designTokens.spacing.lg,
  },
  privacyLink: {
    color: designTokens.colors.primary[600],
    textDecorationLine: 'underline',
  },
});
