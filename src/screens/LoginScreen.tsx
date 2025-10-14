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
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    // TODO: Implement actual authentication with Supabase
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to main app (for now, go to Home)
      navigation.replace('Home');
    }, 1500);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>AT</Text>
            </View>
            <Text style={styles.brandName}>AskToddy</Text>
          </View>
          
          <Text style={styles.welcomeTitle}>
            {isLogin ? 'Welcome back!' : 'Join AskToddy'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {isLogin 
              ? 'Sign in to get instant construction quotes' 
              : 'Create your free account to get started'
            }
          </Text>
        </View>

        {/* Auth Form */}
        <Card variant="elevated" style={styles.authCard}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>
          
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
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleAuth}
            loading={isLoading}
            fullWidth
            style={styles.authButton}
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
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.switchAuthLink}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Free Tier Notice */}
        <Card variant="outlined" style={styles.freeNotice}>
          <Text style={styles.freeNoticeTitle}>🎉 Free Tier Includes:</Text>
          <Text style={styles.freeNoticeText}>
            • Unlimited photo analysis{'\n'}
            • Instant cost estimates{'\n'}
            • Basic material recommendations{'\n'}
            • Community support
          </Text>
        </Card>
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
    padding: designTokens.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: designTokens.spacing['2xl'],
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
    marginBottom: designTokens.spacing.lg,
  },
  formTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  authButton: {
    marginTop: designTokens.spacing.md,
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
    marginBottom: designTokens.spacing.lg,
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
  freeNotice: {
    backgroundColor: designTokens.colors.primary[50],
    borderColor: designTokens.colors.primary[200],
  },
  freeNoticeTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.primary[700],
    marginBottom: designTokens.spacing.sm,
  },
  freeNoticeText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[600],
    lineHeight: designTokens.typography.lineHeight.lg,
  },
});