import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function PricingScreen({ navigation }: any) {
  const { freemiumUser, upgradeUser, user } = useAuth();

  const handleSelectPlan = (planType: 'free' | 'premium') => {
    if (planType === 'free') {
      // Already on free plan
      Alert.alert('Current Plan', "You're already on the free plan.");
      return;
    }

    if (planType === 'premium') {
      Alert.alert(
        'Upgrade to Premium',
        "Premium subscription coming soon! You'll be able to upgrade via Stripe integration.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Notify Me',
            onPress: () => {
              Alert.alert('Thanks!', "We'll notify you when premium subscriptions are available.");
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={designTokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>🏗️ AskToddy Plans</Text>
          <Text style={styles.heroSubtitle}>
            Choose the plan that works best for your construction business
          </Text>
        </View>

        {/* Current Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={user ? 'person-circle' : 'help-circle'}
              size={24}
              color={designTokens.colors.primary[600]}
            />
            <Text style={styles.statusTitle}>Current Status</Text>
          </View>
          <Text style={styles.statusText}>
            Plan: <Text style={styles.statusHighlight}>{freemiumUser.tier}</Text>
          </Text>
          {freemiumUser.tier === 'free' && (
            <Text style={styles.statusText}>
              Quotes used:{' '}
              <Text style={styles.statusHighlight}>
                {freemiumUser.quotesUsed}/{freemiumUser.quotesLimit}
              </Text>
            </Text>
          )}
          {user && (
            <Text style={styles.statusText}>
              Email: <Text style={styles.statusHighlight}>{user.email}</Text>
            </Text>
          )}
        </Card>

        {/* Free Plan */}
        <Card style={[styles.planCard, freemiumUser.tier === 'free' && styles.currentPlan]}>
          {freemiumUser.tier === 'free' && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current Plan</Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <Text style={styles.planName}>Free Plan</Text>
            <Text style={styles.planPrice}>£0</Text>
            <Text style={styles.planPeriod}>per month</Text>
          </View>

          <View style={styles.planFeatures}>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>5 AI-generated quotes per month</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>Save quotes for 30 days</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>UK construction pricing</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>Basic material breakdowns</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="close-circle" size={20} color={designTokens.colors.error[500]} />
              <Text style={[styles.featureText, styles.featureUnavailable]}>
                Voice-to-text notes
              </Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="close-circle" size={20} color={designTokens.colors.error[500]} />
              <Text style={[styles.featureText, styles.featureUnavailable]}>PDF export</Text>
            </View>
          </View>

          <Button
            title={freemiumUser.tier === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            onPress={() => handleSelectPlan('free')}
            variant={freemiumUser.tier === 'free' ? 'secondary' : 'outline'}
            disabled={freemiumUser.tier === 'free'}
          />
        </Card>

        {/* Premium Plan */}
        <Card style={[styles.planCard, styles.premiumPlan]}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>

          <View style={styles.planHeader}>
            <Text style={styles.planName}>Premium</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.planPrice}>£9.99</Text>
              <Text style={styles.planPeriod}>per month</Text>
            </View>
            <Text style={styles.planSaving}>Save 2+ hours per quote</Text>
          </View>

          <View style={styles.planFeatures}>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>Unlimited AI quotes</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>Unlimited quote storage</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>Voice-to-text notes</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>PDF export & sharing</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>WhatsApp/Email sharing</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>Priority AI processing</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={designTokens.colors.success[500]}
              />
              <Text style={styles.featureText}>Premium support</Text>
            </View>
          </View>

          <Button
            title={freemiumUser.tier === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
            onPress={() => handleSelectPlan('premium')}
            variant={freemiumUser.tier === 'premium' ? 'secondary' : 'primary'}
            disabled={freemiumUser.tier === 'premium'}
            icon={
              freemiumUser.tier !== 'premium' ? (
                <Ionicons name="star" size={20} color="white" />
              ) : undefined
            }
          />
        </Card>

        {/* ROI Section */}
        <Card style={styles.roiCard}>
          <Text style={styles.roiTitle}>💰 Why Upgrade?</Text>
          <View style={styles.roiItem}>
            <Ionicons name="time-outline" size={20} color={designTokens.colors.success[600]} />
            <Text style={styles.roiText}>
              Save <Text style={styles.roiHighlight}>2.5 hours</Text> per quote on average
            </Text>
          </View>
          <View style={styles.roiItem}>
            <Ionicons
              name="trending-up-outline"
              size={20}
              color={designTokens.colors.success[600]}
            />
            <Text style={styles.roiText}>
              Generate <Text style={styles.roiHighlight}>20+ quotes</Text> per month
            </Text>
          </View>
          <View style={styles.roiItem}>
            <Ionicons name="cash-outline" size={20} color={designTokens.colors.success[600]} />
            <Text style={styles.roiText}>
              Time value: <Text style={styles.roiHighlight}>£500+ monthly</Text>
            </Text>
          </View>
          <Text style={styles.roiFooter}>Premium pays for itself with just 2 quotes per month</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
  },
  scrollContent: {
    paddingBottom: designTokens.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border.primary,
  },
  backButton: {
    padding: designTokens.spacing.sm,
  },
  headerTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.xl,
    paddingHorizontal: designTokens.spacing.lg,
  },
  heroTitle: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  heroSubtitle: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    marginHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.primary[25],
    borderColor: designTokens.colors.primary[200],
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.md,
  },
  statusTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  statusText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  statusHighlight: {
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.primary[700],
  },
  planCard: {
    marginHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    position: 'relative',
  },
  currentPlan: {
    borderColor: designTokens.colors.success[300],
    backgroundColor: designTokens.colors.success[25],
    borderWidth: 2,
  },
  premiumPlan: {
    borderColor: designTokens.colors.primary[300],
    backgroundColor: designTokens.colors.primary[25],
    borderWidth: 2,
  },
  currentBadge: {
    position: 'absolute',
    top: -designTokens.spacing.sm,
    right: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.success[600],
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.md,
    zIndex: 1,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  popularBadge: {
    position: 'absolute',
    top: -designTokens.spacing.sm,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: designTokens.colors.primary[600],
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.md,
    zIndex: 1,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  planHeader: {
    marginBottom: designTokens.spacing.lg,
  },
  planName: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: designTokens.spacing.sm,
  },
  planPrice: {
    fontSize: designTokens.typography.fontSize['3xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
  },
  planPeriod: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
  },
  planSaving: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.success[600],
    fontStyle: 'italic',
    marginTop: designTokens.spacing.xs,
  },
  planFeatures: {
    marginBottom: designTokens.spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
    gap: designTokens.spacing.sm,
  },
  featureText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  featureUnavailable: {
    color: designTokens.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  roiCard: {
    marginHorizontal: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.success[25],
    borderColor: designTokens.colors.success[200],
  },
  roiTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.lg,
    textAlign: 'center',
  },
  roiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
    gap: designTokens.spacing.sm,
  },
  roiText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  roiHighlight: {
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.success[700],
  },
  roiFooter: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: designTokens.spacing.md,
    fontStyle: 'italic',
  },
});
