/**
 * PrivacyPolicyScreen - Static privacy policy for AskToddy
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import designTokens from '../styles/designTokens';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={designTokens.colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: March 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.body}>
          AskToddy ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, store, and share your personal data when you use the
          AskToddy mobile application and related services.
        </Text>

        <Text style={styles.sectionTitle}>2. Data We Collect</Text>
        <Text style={styles.body}>We may collect the following information:</Text>
        <Text style={styles.bullet}>
          • Account information: email address and password (encrypted).
        </Text>
        <Text style={styles.bullet}>
          • Site assessment data: addresses, job descriptions, measurements, and notes you enter.
        </Text>
        <Text style={styles.bullet}>
          • Photos: images you upload for AI analysis. Photos are processed server-side and are not
          shared publicly.
        </Text>
        <Text style={styles.bullet}>
          • Voice recordings: if you use voice-to-text features, audio is processed for
          transcription only and is not stored long-term.
        </Text>
        <Text style={styles.bullet}>
          • Usage data: app interactions, feature usage, and crash reports to improve the service.
        </Text>
        <Text style={styles.bullet}>
          • Device information: device type, operating system version, and unique device
          identifiers.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Data</Text>
        <Text style={styles.body}>Your data is used to:</Text>
        <Text style={styles.bullet}>
          • Generate AI-powered construction quotes and cost estimates.
        </Text>
        <Text style={styles.bullet}>
          • Maintain your account, saved quotes, and session history.
        </Text>
        <Text style={styles.bullet}>• Improve our AI models and service quality.</Text>
        <Text style={styles.bullet}>• Communicate important service updates.</Text>
        <Text style={styles.bullet}>• Process payments and manage subscriptions.</Text>

        <Text style={styles.sectionTitle}>4. Data Storage & Security</Text>
        <Text style={styles.body}>
          Your data is stored securely using Supabase, a cloud database platform with
          enterprise-grade security. All data is encrypted in transit (TLS) and at rest. We
          implement row-level security policies to ensure you can only access your own data.
          Passwords are hashed and never stored in plain text.
        </Text>

        <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
        <Text style={styles.body}>
          We use the following third-party services to provide our features:
        </Text>
        <Text style={styles.bullet}>
          • Google Gemini AI: processes your site assessment data and photos to generate
          construction quotes. Google's AI processes your data according to their data processing
          terms.
        </Text>
        <Text style={styles.bullet}>
          • Supabase: provides authentication, database storage, and file hosting.
        </Text>
        <Text style={styles.bullet}>
          • RevenueCat: manages in-app subscriptions and purchase validation.
        </Text>
        <Text style={styles.bullet}>
          • Expo/EAS: handles app distribution and push notifications.
        </Text>

        <Text style={styles.sectionTitle}>6. Cookies & Local Storage</Text>
        <Text style={styles.body}>
          The app uses local device storage (AsyncStorage) to save session tokens, preferences, and
          draft quotes for offline access. No third-party tracking cookies are used within the app.
        </Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.body}>
          We retain your account data for as long as your account is active. Saved quotes are kept
          indefinitely unless you delete them. If you delete your account, all associated data will
          be permanently removed within 30 days. Anonymous usage data may be retained in aggregated,
          non-identifiable form.
        </Text>

        <Text style={styles.sectionTitle}>8. Your Rights</Text>
        <Text style={styles.body}>
          Under applicable data protection laws (including UK GDPR), you have the right to:
        </Text>
        <Text style={styles.bullet}>• Access the personal data we hold about you.</Text>
        <Text style={styles.bullet}>• Request correction of inaccurate data.</Text>
        <Text style={styles.bullet}>
          • Request deletion of your data ("right to be forgotten").
        </Text>
        <Text style={styles.bullet}>• Object to or restrict processing of your data.</Text>
        <Text style={styles.bullet}>
          • Data portability — receive your data in a structured format.
        </Text>
        <Text style={styles.bullet}>
          • Withdraw consent at any time where processing is based on consent.
        </Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.body}>
          AskToddy is not intended for use by children under the age of 16. We do not knowingly
          collect personal data from children.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes via the app or email. Continued use of the app after changes constitutes
          acceptance of the updated policy.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this Privacy Policy or wish to exercise your data rights,
          please contact us at:
        </Text>
        <Text style={styles.body}>Email: support@asktoddy.co.uk</Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.navy[900],
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
    width: 32,
  },
  content: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.lg,
  },
  lastUpdated: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.tertiary,
    marginBottom: designTokens.spacing.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
  },
  body: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    lineHeight: 22,
    marginBottom: designTokens.spacing.sm,
  },
  bullet: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    lineHeight: 22,
    marginBottom: designTokens.spacing.xs,
    paddingLeft: designTokens.spacing.md,
  },
  bottomSpacing: {
    height: 40,
  },
});
