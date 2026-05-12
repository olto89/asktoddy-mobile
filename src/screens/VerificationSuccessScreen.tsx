import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import designTokens from '../styles/designTokens';
import { AppIcons, IconSize } from '../styles/iconRegistry';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type VerificationSuccessNavigationProp = StackNavigationProp<
  RootStackParamList,
  'VerificationSuccess'
>;

interface Props {
  navigation: VerificationSuccessNavigationProp;
}

export default function VerificationSuccessScreen({ navigation }: Props) {
  const { isAuthenticated } = useAuth();

  const handleContinue = () => {
    if (isAuthenticated) {
      // User is already logged in via deep link session - go to main app
      navigation.navigate('Main');
    } else {
      // Session not set - user needs to sign in manually
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name={AppIcons.verificationSuccess}
              size={60}
              color={designTokens.colors.success[500]}
            />
          </View>
        </View>

        {/* Header */}
        <Text style={styles.title}>Email Verified!</Text>
        <Text style={styles.subtitle}>
          Your account has been successfully verified.{'\n'}
          You can now sign in to start using AskToddy.
        </Text>

        {/* Success Card */}
        <Card variant="outlined" style={styles.successCard}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons
              name={AppIcons.celebration}
              size={IconSize.medium}
              color={designTokens.colors.success[500]}
            />
            <Text style={styles.successTitle}>You're all set!</Text>
          </View>
          <Text style={styles.successText}>
            {isAuthenticated
              ? 'Your AskToddy account is ready! You can now:'
              : 'Your AskToddy account is ready to use. Sign in to:'}
          </Text>
          <Text style={styles.featureList}>
            • Analyze construction projects{'\n'}• Get instant cost estimates{'\n'}• Find local
            suppliers{'\n'}• Generate professional quotes
          </Text>
        </Card>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isAuthenticated ? 'Continue to App' : 'Continue to Sign In'}
            onPress={handleContinue}
            variant="primary"
            fullWidth
          />
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>Need help? Contact us at support@asktoddy.com</Text>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: designTokens.colors.success[50],
    borderWidth: 3,
    borderColor: designTokens.colors.success[200],
    justifyContent: 'center',
    alignItems: 'center',
    ...designTokens.shadows.lg,
  },
  iconText: {
    fontSize: 60,
  },
  title: {
    fontSize: designTokens.typography.fontSize['3xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.md,
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.lg,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.lg,
    marginBottom: designTokens.spacing['2xl'],
  },
  successCard: {
    width: '100%',
    marginBottom: designTokens.spacing['2xl'],
    backgroundColor: designTokens.colors.success[25],
    borderColor: designTokens.colors.success[200],
  },
  successTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.success[800],
    marginBottom: designTokens.spacing.sm,
    textAlign: 'center',
  },
  successText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.success[700],
    marginBottom: designTokens.spacing.md,
    textAlign: 'center',
  },
  featureList: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.success[600],
    lineHeight: designTokens.typography.lineHeight.lg,
    textAlign: 'left',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: designTokens.spacing.xl,
  },
  helpContainer: {
    paddingHorizontal: designTokens.spacing.md,
  },
  helpText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.base,
  },
});
