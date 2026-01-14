/**
 * RevenueCat Service
 * Handles subscription management for AskToddy freemium model
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API keys - set these in your environment
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Entitlement identifier from RevenueCat dashboard
export const ENTITLEMENT_ID = 'premium';

// Product identifiers (set these up in App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  MONTHLY: 'asktoddy_pro_monthly', // £9.99/month
  ANNUAL: 'asktoddy_pro_annual', // £79.99/year (save 33%)
};

export interface SubscriptionStatus {
  isSubscribed: boolean;
  isPremium: boolean;
  expirationDate: Date | null;
  willRenew: boolean;
  productIdentifier: string | null;
}

class RevenueCatService {
  private isInitialized = false;
  private customerInfo: CustomerInfo | null = null;

  /**
   * Initialize RevenueCat SDK
   * Call this once when app starts (in App.tsx)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

    if (!apiKey) {
      console.warn('RevenueCat API key not configured for', Platform.OS);
      return;
    }

    try {
      await Purchases.configure({ apiKey });
      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');

      // Get initial customer info
      await this.refreshCustomerInfo();
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  /**
   * Set user ID for RevenueCat (call after user logs in)
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized');
      return;
    }

    try {
      await Purchases.logIn(userId);
      await this.refreshCustomerInfo();
      console.log('RevenueCat user ID set:', userId);
    } catch (error) {
      console.error('Failed to set RevenueCat user ID:', error);
    }
  }

  /**
   * Clear user ID (call on logout)
   */
  async clearUserId(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await Purchases.logOut();
      this.customerInfo = null;
      console.log('RevenueCat user logged out');
    } catch (error) {
      console.error('Failed to clear RevenueCat user:', error);
    }
  }

  /**
   * Refresh customer info from RevenueCat
   */
  async refreshCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isInitialized) return null;

    try {
      this.customerInfo = await Purchases.getCustomerInfo();
      return this.customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Check if user has premium access
   */
  async checkPremiumStatus(): Promise<SubscriptionStatus> {
    const defaultStatus: SubscriptionStatus = {
      isSubscribed: false,
      isPremium: false,
      expirationDate: null,
      willRenew: false,
      productIdentifier: null,
    };

    if (!this.isInitialized) return defaultStatus;

    try {
      const customerInfo = await this.refreshCustomerInfo();
      if (!customerInfo) return defaultStatus;

      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

      if (entitlement) {
        return {
          isSubscribed: true,
          isPremium: true,
          expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
          willRenew: entitlement.willRenew,
          productIdentifier: entitlement.productIdentifier,
        };
      }

      return defaultStatus;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return defaultStatus;
    }
  }

  /**
   * Get available subscription packages
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    if (!this.isInitialized) return null;

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    if (!this.isInitialized) {
      return { success: false, error: 'RevenueCat not initialized' };
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      this.customerInfo = customerInfo;

      // Check if purchase granted premium entitlement
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      return {
        success: isPremium,
        customerInfo,
        error: isPremium ? undefined : 'Purchase completed but entitlement not granted',
      };
    } catch (error: any) {
      // Handle user cancellation
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }

      console.error('Purchase failed:', error);
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<{
    success: boolean;
    isPremium: boolean;
    error?: string;
  }> {
    if (!this.isInitialized) {
      return { success: false, isPremium: false, error: 'RevenueCat not initialized' };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;

      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      return { success: true, isPremium };
    } catch (error: any) {
      console.error('Restore failed:', error);
      return { success: false, isPremium: false, error: error.message };
    }
  }

  /**
   * Check if RevenueCat is properly configured
   */
  isConfigured(): boolean {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
    return !!apiKey;
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
export default revenueCatService;
