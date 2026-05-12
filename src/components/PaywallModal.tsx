/**
 * PaywallModal - Premium feature upgrade modal
 * Shows when users try to access premium features
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import designTokens from '../styles/designTokens';
import {
  PremiumFeature,
  SUBSCRIPTION_PLANS,
  subscriptionService,
} from '../services/SubscriptionService';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  feature: PremiumFeature;
  onStartTrial?: () => void;
  onUpgrade?: (planId: string) => void;
}

export default function PaywallModal({
  visible,
  onClose,
  feature,
  onStartTrial,
  onUpgrade,
}: PaywallModalProps) {
  const isFreePlan = subscriptionService.isFreePlan();
  const message = subscriptionService.getPaywallMessage(feature);
  const ctaText = subscriptionService.getUpgradeCTA(feature);

  const handleStartTrial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartTrial?.();
  };

  const handleUpgrade = (planId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpgrade?.(planId);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={designTokens.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <Ionicons name="diamond" size={48} color={designTokens.colors.primary[500]} />
            </View>
            <Text style={styles.title}>Unlock Professional Features</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </View>

          {/* Feature List */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What you get with AskToddy Pro:</Text>
            {SUBSCRIPTION_PLANS.pro_monthly.features.map((featureText, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={designTokens.colors.success[500]}
                />
                <Text style={styles.featureText}>{featureText}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            <Text style={styles.plansTitle}>Choose your plan:</Text>

            {/* Yearly Plan - Recommended */}
            <TouchableOpacity
              style={[styles.planCard, styles.recommendedPlan]}
              onPress={() => handleUpgrade('pro_yearly')}
            >
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>BEST VALUE</Text>
              </View>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{SUBSCRIPTION_PLANS.pro_yearly.name}</Text>
                <Text style={styles.planPrice}>{SUBSCRIPTION_PLANS.pro_yearly.price}/year</Text>
                <Text style={styles.planSavings}>Save £20 per year</Text>
              </View>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity style={styles.planCard} onPress={() => handleUpgrade('pro_monthly')}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{SUBSCRIPTION_PLANS.pro_monthly.name}</Text>
                <Text style={styles.planPrice}>{SUBSCRIPTION_PLANS.pro_monthly.price}/month</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Trial CTA */}
          {isFreePlan && (
            <TouchableOpacity style={styles.trialButton} onPress={handleStartTrial}>
              <Text style={styles.trialButtonText}>Start 7-Day Free Trial</Text>
            </TouchableOpacity>
          )}

          {/* Fine Print */}
          <View style={styles.finePrint}>
            <Text style={styles.finePrintText}>
              • Cancel anytime in Settings{'\n'}• Free trial automatically converts to monthly
              subscription{'\n'}• All prices in GBP, including VAT
            </Text>
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
  },
  hero: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: designTokens.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  title: {
    fontSize: designTokens.typography.fontSize.xxl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.lg,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: designTokens.spacing.xl,
  },
  featuresTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
    gap: designTokens.spacing.md,
  },
  featureText: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    lineHeight: 22,
  },
  plansContainer: {
    marginBottom: designTokens.spacing.xl,
  },
  plansTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.lg,
  },
  planCard: {
    backgroundColor: designTokens.colors.background.primary,
    borderWidth: 2,
    borderColor: designTokens.colors.grey[200],
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.md,
    position: 'relative',
  },
  recommendedPlan: {
    borderColor: designTokens.colors.primary[500],
    backgroundColor: designTokens.colors.primary[50],
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.primary[500],
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
  },
  recommendedText: {
    color: '#fff',
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.bold as any,
  },
  planHeader: {
    alignItems: 'center',
  },
  planName: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.xs,
  },
  planPrice: {
    fontSize: designTokens.typography.fontSize.xxl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginBottom: designTokens.spacing.xs,
  },
  planSavings: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.success[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  trialButton: {
    backgroundColor: designTokens.colors.primary[500],
    borderRadius: designTokens.borderRadius.xl,
    paddingVertical: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.xl,
    alignItems: 'center',
    marginBottom: designTokens.spacing.xl,
  },
  trialButtonText: {
    color: '#fff',
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
  },
  finePrint: {
    paddingVertical: designTokens.spacing.lg,
    alignItems: 'center',
  },
  finePrintText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
