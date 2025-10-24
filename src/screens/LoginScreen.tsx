import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import ErrorAlert from '../components/ui/ErrorAlert';
import { getAuthErrorMessage, getActionButtonText } from '../utils/authErrors';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<{
    title: string;
    message: string;
    suggestion?: string;
    action?: string;
  } | null>(null);

  const handleAuth = async () => {
    // Clear any existing errors at the start of a new attempt
    setError(null);
    setLocalLoading(true);

    // Safety timeout to prevent stuck loading
    const safetyTimeout = setTimeout(() => {
      console.warn('Login safety timeout reached, stopping local loading');
      setLocalLoading(false);
      // Show timeout error
      setError({
        title: 'Connection Timeout',
        message: 'Login attempt timed out',
        suggestion: 'Please check your internet connection and try again',
        action: 'retry',
      });
    }, 35000); // 35 seconds - slightly longer than AuthContext timeout

    try {
      // Basic validation
      if (!email || !password) {
        setError({
          title: 'Missing Information',
          message: 'Please fill in all fields',
          suggestion: 'Both email and password are required',
        });
        return;
      }

      if (!isLogin && password !== confirmPassword) {
        setError({
          title: 'Password Mismatch',
          message: 'Passwords do not match',
          suggestion: 'Please make sure both password fields are identical',
        });
        return;
      }

      if (!isLogin && password.length < 6) {
        setError({
          title: 'Weak Password',
          message: 'Password must be at least 6 characters long',
          suggestion: 'Use a stronger password for better security',
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError({
          title: 'Invalid Email',
          message: 'Please enter a valid email address',
          suggestion: 'Check the email format (example@domain.com)',
        });
        return;
      }

      // Perform authentication
      if (isLogin) {
        console.log('🔐 Attempting login for:', email);
        const { error } = await signIn(email, password);
        if (error) {
          console.error('❌ Login failed:', error);
          const errorInfo = getAuthErrorMessage(error);
          setError({
            title: 'Sign In Failed',
            message: errorInfo.message,
            suggestion: errorInfo.suggestion,
            action: errorInfo.action,
          });
          return;
        } else {
          console.log('✅ Login successful');
        }
      } else {
        const { error, needsVerification } = await signUp(email, password);
        if (error) {
          const errorInfo = getAuthErrorMessage(error);
          setError({
            title: 'Sign Up Failed',
            message: errorInfo.message,
            suggestion: errorInfo.suggestion,
            action: errorInfo.action,
          });
          return;
        }

        if (needsVerification) {
          // Navigate to email verification screen
          navigation.navigate('EmailVerification', { email, password });
          return;
        }

        // If no verification needed, user is automatically signed in
        Alert.alert('Success', 'Account created successfully! You are now signed in.');
      }

      // Navigation will be handled by auth state change
    } catch (error) {
      const errorInfo = getAuthErrorMessage(error);
      setError({
        title: 'Connection Error',
        message: errorInfo.message,
        suggestion: errorInfo.suggestion,
        action: errorInfo.action,
      });
      console.error('Auth error:', error);
    } finally {
      // Always clear loading and timeout
      clearTimeout(safetyTimeout);
      setLocalLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setConfirmPassword('');
    setError(null); // Clear errors when switching modes
  };

  const handleErrorAction = () => {
    if (!error?.action) return;

    switch (error.action) {
      case 'forgot_password':
        // TODO: Implement forgot password functionality
        Alert.alert('Forgot Password', 'This feature will be available soon!');
        break;
      case 'signup':
        setIsLogin(false);
        setError(null);
        break;
      case 'contact_support':
        Alert.alert('Contact Support', 'Email us at support@asktoddy.com for help');
        break;
      case 'retry':
      default:
        setError(null);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>AT</Text>
            </View>
            <Text style={styles.brandName}>AskToddy</Text>
          </View>

          <Text style={styles.welcomeTitle}>{isLogin ? 'Welcome back!' : 'Join AskToddy'}</Text>
          <Text style={styles.welcomeSubtitle}>
            {isLogin
              ? 'Sign in to get instant construction quotes'
              : 'Create your free account to get started'}
          </Text>
        </View>

        {/* Error Alert */}
        <ErrorAlert
          title={error?.title || ''}
          message={error?.message || ''}
          suggestion={error?.suggestion}
          actionText={error?.action ? getActionButtonText(error.action) : undefined}
          onActionPress={handleErrorAction}
          onDismiss={() => setError(null)}
          visible={!!error}
          persistent={true}
        />

        {/* Auth Form */}
        <Card variant="elevated" style={styles.authCard}>
          <Text style={styles.formTitle}>{isLogin ? 'Sign In' : 'Create Account'}</Text>

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {!isLogin && (
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          )}

          <Button
            title={
              loading || localLoading ? 'Connecting...' : isLogin ? 'Sign In' : 'Create Account'
            }
            onPress={handleAuth}
            loading={loading || localLoading}
            fullWidth
            style={styles.authButton}
            disabled={loading || localLoading}
          />

          {isLogin && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Switch Auth Mode */}
        <View style={styles.switchAuthContainer}>
          <Text style={styles.switchAuthText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.switchAuthLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    padding: designTokens.spacing['2xl'],
    paddingTop: designTokens.spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: designTokens.spacing['3xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: designTokens.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
    ...designTokens.shadows.md,
  },
  logoText: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.inverse,
  },
  brandName: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
  },
  welcomeTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.lg,
  },
  authCard: {
    marginBottom: designTokens.spacing['2xl'],
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing['2xl'],
  },
  formTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing['2xl'],
  },
  authButton: {
    marginTop: designTokens.spacing.xl,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: designTokens.spacing.md,
  },
  forgotPasswordText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium,
  },
  switchAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing['2xl'],
    marginTop: designTokens.spacing.xl,
  },
  switchAuthText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
  },
  switchAuthLink: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.semibold,
  },
});
