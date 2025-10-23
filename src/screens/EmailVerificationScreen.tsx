import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type EmailVerificationNavigationProp = StackNavigationProp<RootStackParamList, 'EmailVerification'>;
type EmailVerificationRouteProp = RouteProp<RootStackParamList, 'EmailVerification'>;

interface Props {
  navigation: EmailVerificationNavigationProp;
  route: EmailVerificationRouteProp;
}

export default function EmailVerificationScreen({ navigation, route }: Props) {
  const { signUp } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { email, password } = route.params;

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    try {
      setIsResending(true);
      const { error } = await signUp(email, password);
      
      if (error) {
        Alert.alert('Error', 'Failed to resend verification email. Please try again.');
      } else {
        Alert.alert('Success', 'Verification email sent! Please check your inbox.');
        
        // Start 60-second cooldown
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleOpenEmailApp = () => {
    Linking.openURL('mailto:');
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.iconText}>📧</Text>
          </View>
        </View>

        {/* Header */}
        <Text style={styles.title}>Check your email!</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        {/* Instructions */}
        <Card variant="outlined" style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Next steps:</Text>
          <Text style={styles.instructionsText}>
            1. Check your email inbox{'\n'}
            2. Click the verification link{'\n'}
            3. Return to the app and sign in
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Open Email App"
            onPress={handleOpenEmailApp}
            variant="primary"
            fullWidth
            style={styles.primaryButton}
          />

          <Button
            title={resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
            onPress={handleResendEmail}
            variant="outline"
            fullWidth
            disabled={isResending || resendCooldown > 0}
            loading={isResending}
            style={styles.secondaryButton}
          />

          <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Didn't receive the email? Check your spam folder or try a different email address.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: designTokens.spacing['2xl'],
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: designTokens.colors.success[50],
    borderWidth: 2,
    borderColor: designTokens.colors.success[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.md,
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.lg,
    marginBottom: designTokens.spacing['2xl'],
  },
  email: {
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.primary[600],
  },
  instructionsCard: {
    width: '100%',
    marginBottom: designTokens.spacing['2xl'],
    backgroundColor: designTokens.colors.primary[25],
    borderColor: designTokens.colors.primary[100],
  },
  instructionsTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.primary[700],
    marginBottom: designTokens.spacing.sm,
  },
  instructionsText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[600],
    lineHeight: designTokens.typography.lineHeight.lg,
  },
  buttonContainer: {
    width: '100%',
    gap: designTokens.spacing.md,
  },
  primaryButton: {
    marginBottom: designTokens.spacing.sm,
  },
  secondaryButton: {
    marginBottom: designTokens.spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md,
  },
  backButtonText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium,
  },
  helpContainer: {
    marginTop: designTokens.spacing.xl,
    paddingHorizontal: designTokens.spacing.md,
  },
  helpText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.base,
  },
});