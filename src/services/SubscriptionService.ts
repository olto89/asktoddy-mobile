/**
 * SubscriptionService - Manages premium subscription and paywall logic
 * Handles feature flags and subscription status
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: 'monthly' | 'yearly';
  features: string[];
}

export interface UserSubscription {
  isActive: boolean;
  plan?: SubscriptionPlan;
  expiresAt?: Date;
  trialEndsAt?: Date;
  isTrialActive: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '£0',
    period: 'monthly',
    features: ['Basic quote estimates', 'Image upload', 'Location-based pricing', 'Chat history'],
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: '£9.99',
    period: 'monthly',
    features: [
      'Everything in Free',
      'Professional PDF quotes',
      'Custom company logo',
      'Email quote sharing',
      'Priority support',
      'Unlimited quotes',
    ],
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    price: '£99.99',
    period: 'yearly',
    features: [
      'Everything in Pro Monthly',
      '2 months free',
      'Advanced analytics',
      'Team collaboration',
      'API access',
    ],
  },
};

export const PREMIUM_FEATURES = {
  PDF_GENERATION: 'pdf_generation',
  COMPANY_LOGO: 'company_logo',
  EMAIL_SHARING: 'email_sharing',
  UNLIMITED_QUOTES: 'unlimited_quotes',
  PRIORITY_SUPPORT: 'priority_support',
  ANALYTICS: 'analytics',
  TEAM_COLLABORATION: 'team_collaboration',
  API_ACCESS: 'api_access',
} as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[keyof typeof PREMIUM_FEATURES];

class SubscriptionService {
  private currentSubscription: UserSubscription | null = null;
  private initialized = false;

  /**
   * Initialize subscription service - load from storage/API
   */
  async initialize(): Promise<void> {
    try {
      // TODO: Load from AsyncStorage or API call to backend
      // For now, simulate with default free plan
      this.currentSubscription = {
        isActive: false,
        isTrialActive: false,
      };

      this.initialized = true;
      logger.debug('🔐 SubscriptionService initialized');
    } catch (error) {
      console.error('Failed to initialize SubscriptionService:', error);
    }
  }

  /**
   * Check if user has access to a premium feature
   */
  hasFeatureAccess(feature: PremiumFeature): boolean {
    if (!this.initialized) {
      logger.warn('SubscriptionService not initialized');
      return false;
    }

    // During development, allow all features
    if (__DEV__) {
      return true;
    }

    // Check trial access
    if (this.currentSubscription?.isTrialActive) {
      return true;
    }

    // Check active subscription
    if (this.currentSubscription?.isActive) {
      return true;
    }

    // Free tier features
    const freeFeatures: PremiumFeature[] = [];
    if (freeFeatures.includes(feature)) {
      return true;
    }

    return false;
  }

  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): UserSubscription | null {
    return this.currentSubscription;
  }

  /**
   * Check if user is on free plan
   */
  isFreePlan(): boolean {
    return !this.currentSubscription?.isActive && !this.currentSubscription?.isTrialActive;
  }

  /**
   * Check if user is in trial period
   */
  isInTrial(): boolean {
    return this.currentSubscription?.isTrialActive || false;
  }

  /**
   * Start free trial (7 days)
   */
  async startFreeTrial(): Promise<boolean> {
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      this.currentSubscription = {
        isActive: false,
        isTrialActive: true,
        trialEndsAt: trialEnd,
      };

      // TODO: Save to AsyncStorage and sync with backend
      logger.debug('🆓 Free trial started:', trialEnd);
      return true;
    } catch (error) {
      console.error('Failed to start trial:', error);
      return false;
    }
  }

  /**
   * Activate premium subscription
   */
  async activateSubscription(planId: string): Promise<boolean> {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error(`Invalid plan: ${planId}`);
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (plan.period === 'yearly' ? 12 : 1));

      this.currentSubscription = {
        isActive: true,
        isTrialActive: false,
        plan,
        expiresAt,
      };

      // TODO: Process payment and sync with backend
      logger.debug('💎 Subscription activated:', plan.name);
      return true;
    } catch (error) {
      console.error('Failed to activate subscription:', error);
      return false;
    }
  }

  /**
   * Get paywall message for a feature
   */
  getPaywallMessage(feature: PremiumFeature): string {
    const messages = {
      [PREMIUM_FEATURES.PDF_GENERATION]: 'Generate professional PDF quotes with your company logo',
      [PREMIUM_FEATURES.COMPANY_LOGO]: 'Add your company logo to quotes',
      [PREMIUM_FEATURES.EMAIL_SHARING]: 'Email quotes directly to clients',
      [PREMIUM_FEATURES.UNLIMITED_QUOTES]: 'Create unlimited quotes',
      [PREMIUM_FEATURES.PRIORITY_SUPPORT]: 'Get priority customer support',
      [PREMIUM_FEATURES.ANALYTICS]: 'View detailed quote analytics',
      [PREMIUM_FEATURES.TEAM_COLLABORATION]: 'Collaborate with team members',
      [PREMIUM_FEATURES.API_ACCESS]: 'Integrate with other tools via API',
    };

    return messages[feature] || 'Unlock premium features';
  }

  /**
   * Get upgrade call-to-action for a feature
   */
  getUpgradeCTA(feature: PremiumFeature): string {
    if (this.isFreePlan()) {
      return 'Start 7-day free trial';
    }
    return 'Upgrade to Pro';
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
