import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import useSubscription from '../hooks/useSubscription';
import designTokens from '../styles/designTokens';
import { AppIcons, IconSize } from '../styles/iconRegistry';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function PricingScreen({ navigation }: any) {
  const { freemiumUser, user, refreshPremiumStatus } = useAuth();
  const { monthlyPackage, purchaseMonthly, restorePurchases, isLoading, error, clearError } =
    useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleSelectPlan = async (planType: 'free' | 'premium') => {
    if (planType === 'free') {
      // Already on free plan
      Alert.alert('Current Plan', "You're already on the free plan.");
      return;
    }

    // planType === 'premium' → real RevenueCat purchase
    setIsPurchasing(true);
    clearError();
    try {
      const success = await purchaseMonthly();
      if (success) {
        await refreshPremiumStatus();
        Alert.alert(
          'Welcome to Premium!',
          'You now have unlimited quotes and all premium features.',
          [{ text: 'Great!', onPress: () => navigation.goBack() }]
        );
      } else if (error) {
        // purchaseMonthly swallows user-cancellation; only surface real errors
        Alert.alert('Purchase Unsuccessful', error);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    clearError();
    try {
      const restored = await restorePurchases();
      if (restored) {
        await refreshPremiumStatus();
        Alert.alert('Purchases Restored', 'Your premium subscription has been restored.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
      }
    } finally {
      setIsPurchasing(false);
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
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons
              name={AppIcons.brand}
              size={IconSize.large}
              color={designTokens.colors.primary[500]}
            />
            <Text style={styles.heroTitle}>AskToddy Plans</Text>
          </View>
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
              <Text style={styles.planPrice}>
                {monthlyPackage?.product?.priceString ?? '£9.99'}
              </Text>
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
            title={
              freemiumUser.tier === 'premium'
                ? 'Current Plan'
                : isPurchasing
                  ? 'Processing…'
                  : 'Upgrade to Premium'
            }
            onPress={() => handleSelectPlan('premium')}
            variant={freemiumUser.tier === 'premium' ? 'secondary' : 'primary'}
            disabled={freemiumUser.tier === 'premium' || isPurchasing || isLoading}
            icon={
              freemiumUser.tier !== 'premium' ? (
                isPurchasing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="star" size={20} color="white" />
                )
              ) : undefined
            }
          />

          {freemiumUser.tier !== 'premium' && (
            <>
              <TouchableOpacity
                onPress={handleRestore}
                style={styles.restoreButton}
                disabled={isPurchasing}
                testID="restore-purchases-button"
              >
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </>
          )}
        </Card>

        {/* ROI Section */}
        <Card style={styles.roiCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons
              name={AppIcons.whyUpgrade}
              size={IconSize.medium}
              color={designTokens.colors.text.primary}
            />
            <Text style={styles.roiTitle}>Why Upgrade?</Text>
          </View>
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
  restoreButton: {
    alignItems: 'center',
    marginTop: designTokens.spacing.md,
    padding: designTokens.spacing.sm,
  },
  restoreButtonText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[600],
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.error[500],
    textAlign: 'center',
    marginTop: designTokens.spacing.sm,
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
