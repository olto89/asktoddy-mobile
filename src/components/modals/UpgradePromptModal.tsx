import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import useSubscription from '../../hooks/useSubscription';
import designTokens from '../../styles/designTokens';
import { AppIcons, IconSize } from '../../styles/iconRegistry';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  reason?: 'quota_exceeded' | 'premium_feature' | 'general';
}

export default function UpgradePromptModal({
  visible,
  onClose,
  onUpgrade,
  reason = 'quota_exceeded',
}: UpgradePromptModalProps) {
  const { freemiumUser, refreshPremiumStatus } = useAuth();
  const {
    isLoading,
    monthlyPackage,
    annualPackage,
    purchaseMonthly,
    restorePurchases,
    error,
    clearError,
  } = useSubscription();

  const [isPurchasing, setIsPurchasing] = useState(false);

  const getReasonContent = () => {
    switch (reason) {
      case 'quota_exceeded':
        return {
          title: 'Quote Limit Reached',
          subtitle: `You've used all ${freemiumUser.quotesLimit} free quotes this month`,
          iconName: AppIcons.quotaExceeded,
        };
      case 'premium_feature':
        return {
          title: 'Premium Feature',
          subtitle: 'This feature is available for premium subscribers',
          iconName: AppIcons.premiumFeature,
        };
      default:
        return {
          title: 'Upgrade to Premium',
          subtitle: 'Unlock all features and unlimited quotes',
          iconName: AppIcons.upgradeGeneral,
        };
    }
  };

  const { title, subtitle, iconName } = getReasonContent();

  const handleUpgrade = async () => {
    setIsPurchasing(true);
    clearError();

    try {
      const success = await purchaseMonthly();

      if (success) {
        // Refresh premium status in AuthContext
        await refreshPremiumStatus();
        Alert.alert(
          'Welcome to Premium!',
          'You now have unlimited quotes and all premium features.'
        );
        onUpgrade?.();
        onClose();
      }
    } catch (err) {
      console.error('Purchase error:', err);
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
        Alert.alert('Purchases Restored', 'Your premium subscription has been restored.');
        onClose();
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
      }
    } catch (err) {
      console.error('Restore error:', err);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Get actual price from RevenueCat if available
  const monthlyPrice = monthlyPackage?.product?.priceString || '£9.99/month';

  return (
    <Modal
      testID="upgrade-prompt-modal"
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={designTokens.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Hero Section */}
            <View style={styles.hero}>
              <Ionicons
                name={iconName}
                size={IconSize.xlarge}
                color={designTokens.colors.primary[500]}
                style={{ marginBottom: designTokens.spacing.md }}
              />
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {/* Pricing Cards */}
            <View style={styles.pricingSection}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>

              {/* Current Plan (Free) */}
              <Card style={[styles.planCard, styles.currentPlan]}>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>Free</Text>
                    <Text style={styles.planPrice}>£0/month</Text>
                  </View>
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                </View>
                <View style={styles.planFeatures}>
                  <View style={styles.feature}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={designTokens.colors.success[500]}
                    />
                    <Text style={styles.featureText}>5 AI quotes per month</Text>
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
                      name="close-circle"
                      size={20}
                      color={designTokens.colors.error[500]}
                    />
                    <Text style={[styles.featureText, styles.featureUnavailable]}>
                      Voice-to-text notes
                    </Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={designTokens.colors.error[500]}
                    />
                    <Text style={[styles.featureText, styles.featureUnavailable]}>PDF export</Text>
                  </View>
                </View>
              </Card>

              {/* Premium Plan */}
              <Card style={[styles.planCard, styles.premiumPlan]}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>Premium</Text>
                    <Text style={styles.planPrice}>{monthlyPrice}</Text>
                    <Text style={styles.planSaving}>Save 2+ hours per quote</Text>
                  </View>
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
                    <Text style={styles.featureText}>Priority AI processing</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={designTokens.colors.success[500]}
                    />
                    <Text style={styles.featureText}>WhatsApp/Email sharing</Text>
                  </View>
                </View>

                <Button
                  title={isPurchasing ? 'Processing...' : `Upgrade to Premium - ${monthlyPrice}`}
                  onPress={handleUpgrade}
                  variant="primary"
                  style={styles.upgradeButton}
                  disabled={isPurchasing || isLoading}
                  icon={
                    isPurchasing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="star" size={20} color="white" />
                    )
                  }
                />

                <TouchableOpacity
                  onPress={handleRestore}
                  style={styles.restoreButton}
                  disabled={isPurchasing}
                >
                  <Text style={styles.restoreButtonText}>Restore Purchases</Text>
                </TouchableOpacity>

                {error && <Text style={styles.errorText}>{error}</Text>}
              </Card>
            </View>

            {/* ROI Section */}
            <Card style={styles.roiCard}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: designTokens.spacing.md,
                }}
              >
                <Ionicons
                  name={AppIcons.roi}
                  size={IconSize.medium}
                  color={designTokens.colors.text.primary}
                />
                <Text style={[styles.roiTitle, { marginBottom: 0 }]}>Return on Investment</Text>
              </View>
              <Text style={styles.roiText}>
                Average contractor saves <Text style={styles.roiHighlight}>2.5 hours</Text> per
                quote
              </Text>
              <Text style={styles.roiText}>
                Time saved per month: <Text style={styles.roiHighlight}>20+ hours</Text>
              </Text>
              <Text style={styles.roiText}>
                Value of time saved: <Text style={styles.roiHighlight}>£500+ per month</Text>
              </Text>
              <Text style={styles.roiSubtext}>
                Premium pays for itself with just 2 quotes saved per month
              </Text>
            </Card>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Join thousands of contractors saving time with AskToddy
              </Text>

              <TouchableOpacity onPress={onClose} style={styles.laterButton}>
                <Text style={styles.laterButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
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
  hero: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.xl,
  },
  heroEmoji: {
    fontSize: designTokens.typography.fontSize['4xl'],
    marginBottom: designTokens.spacing.md,
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
  pricingSection: {
    marginBottom: designTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  planCard: {
    marginBottom: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    position: 'relative',
  },
  currentPlan: {
    borderColor: designTokens.colors.border.primary,
    backgroundColor: designTokens.colors.background.secondary,
  },
  premiumPlan: {
    borderColor: designTokens.colors.primary[300],
    backgroundColor: designTokens.colors.primary[25],
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.lg,
  },
  planName: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.xs,
  },
  planPrice: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginBottom: designTokens.spacing.xs,
  },
  planSaving: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.success[600],
    fontStyle: 'italic',
  },
  currentBadge: {
    backgroundColor: designTokens.colors.text.secondary,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.md,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  popularBadge: {
    position: 'absolute',
    top: -designTokens.spacing.sm,
    left: '50%',
    transform: [{ translateX: -60 }],
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
  planFeatures: {
    marginBottom: designTokens.spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
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
  upgradeButton: {
    marginTop: designTokens.spacing.md,
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
    padding: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.success[25],
    borderColor: designTokens.colors.success[200],
    marginBottom: designTokens.spacing.xl,
  },
  roiTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.md,
    textAlign: 'center',
  },
  roiText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
    textAlign: 'center',
  },
  roiHighlight: {
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.success[700],
  },
  roiSubtext: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: designTokens.spacing.sm,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    gap: designTokens.spacing.lg,
  },
  footerText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
  },
  laterButton: {
    padding: designTokens.spacing.md,
  },
  laterButtonText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.tertiary,
    textAlign: 'center',
  },
});
