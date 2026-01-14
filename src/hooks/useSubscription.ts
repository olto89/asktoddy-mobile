/**
 * useSubscription Hook
 * React hook for subscription management with RevenueCat
 */

import { useState, useEffect, useCallback } from 'react';
import { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import revenueCatService, { SubscriptionStatus, PRODUCT_IDS } from '../services/RevenueCatService';

interface UseSubscriptionReturn {
  // Status
  isLoading: boolean;
  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus | null;

  // Offerings
  offerings: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;

  // Actions
  purchaseMonthly: () => Promise<boolean>;
  purchaseAnnual: () => Promise<boolean>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      // Check subscription status
      const status = await revenueCatService.checkPremiumStatus();
      setSubscriptionStatus(status);
      setIsPremium(status.isPremium);

      // Load offerings
      const currentOfferings = await revenueCatService.getOfferings();
      setOfferings(currentOfferings);
    } catch (err: any) {
      console.error('Failed to load subscription data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = useCallback(async () => {
    const status = await revenueCatService.checkPremiumStatus();
    setSubscriptionStatus(status);
    setIsPremium(status.isPremium);
  }, []);

  // Get specific packages
  const monthlyPackage =
    offerings?.availablePackages.find(pkg => pkg.product.identifier === PRODUCT_IDS.MONTHLY) ||
    offerings?.monthly ||
    null;

  const annualPackage =
    offerings?.availablePackages.find(pkg => pkg.product.identifier === PRODUCT_IDS.ANNUAL) ||
    offerings?.annual ||
    null;

  // Purchase handlers
  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await revenueCatService.purchasePackage(pkg);

        if (result.success) {
          await refreshStatus();
          return true;
        } else {
          if (result.error !== 'Purchase cancelled') {
            setError(result.error || 'Purchase failed');
          }
          return false;
        }
      } catch (err: any) {
        setError(err.message || 'Purchase failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshStatus]
  );

  const purchaseMonthly = useCallback(async (): Promise<boolean> => {
    if (!monthlyPackage) {
      setError('Monthly package not available');
      return false;
    }
    return purchasePackage(monthlyPackage);
  }, [monthlyPackage, purchasePackage]);

  const purchaseAnnual = useCallback(async (): Promise<boolean> => {
    if (!annualPackage) {
      setError('Annual package not available');
      return false;
    }
    return purchasePackage(annualPackage);
  }, [annualPackage, purchasePackage]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await revenueCatService.restorePurchases();

      if (result.success) {
        setIsPremium(result.isPremium);
        await refreshStatus();
        return result.isPremium;
      } else {
        setError(result.error || 'Restore failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Restore failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    isPremium,
    subscriptionStatus,
    offerings,
    monthlyPackage,
    annualPackage,
    purchaseMonthly,
    purchaseAnnual,
    purchasePackage,
    restorePurchases,
    refreshStatus,
    error,
    clearError,
  };
}

export default useSubscription;
