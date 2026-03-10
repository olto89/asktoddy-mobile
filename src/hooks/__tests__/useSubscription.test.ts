/* eslint-disable @typescript-eslint/no-explicit-any, max-lines-per-function */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSubscription } from '../useSubscription';
import revenueCatService from '../../services/RevenueCatService';

const mockRevenueCat = revenueCatService as jest.Mocked<typeof revenueCatService>;

describe('useSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: non-premium user with no offerings
    mockRevenueCat.checkPremiumStatus.mockResolvedValue({
      isSubscribed: false,
      isPremium: false,
      expirationDate: null,
      willRenew: false,
      productIdentifier: null,
    });
    mockRevenueCat.getOfferings.mockResolvedValue(null);
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useSubscription());
    expect(result.current.isLoading).toBe(true);
  });

  it('loads subscription status on mount', async () => {
    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);
    expect(result.current.subscriptionStatus).toEqual(
      expect.objectContaining({ isPremium: false })
    );
    expect(mockRevenueCat.checkPremiumStatus).toHaveBeenCalledTimes(1);
    expect(mockRevenueCat.getOfferings).toHaveBeenCalledTimes(1);
  });

  it('reflects premium status when subscribed', async () => {
    mockRevenueCat.checkPremiumStatus.mockResolvedValue({
      isSubscribed: true,
      isPremium: true,
      expirationDate: new Date('2026-12-31'),
      willRenew: true,
      productIdentifier: 'asktoddy_pro_monthly',
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(true);
    expect(result.current.subscriptionStatus?.willRenew).toBe(true);
  });

  it('sets error when loading fails', async () => {
    mockRevenueCat.checkPremiumStatus.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('clearError resets error state', async () => {
    mockRevenueCat.checkPremiumStatus.mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('purchaseMonthly returns false when no package available', async () => {
    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.purchaseMonthly();
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe('Monthly package not available');
  });

  it('purchaseAnnual returns false when no package available', async () => {
    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.purchaseAnnual();
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe('Annual package not available');
  });

  it('restorePurchases handles failure', async () => {
    mockRevenueCat.restorePurchases.mockResolvedValue({
      success: false,
      isPremium: false,
      error: 'Nothing to restore',
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.restorePurchases();
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe('Nothing to restore');
  });

  it('refreshStatus updates premium state', async () => {
    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);

    // Simulate user subscribing
    mockRevenueCat.checkPremiumStatus.mockResolvedValue({
      isSubscribed: true,
      isPremium: true,
      expirationDate: new Date('2026-12-31'),
      willRenew: true,
      productIdentifier: 'asktoddy_pro_monthly',
    });

    await act(async () => {
      await result.current.refreshStatus();
    });

    expect(result.current.isPremium).toBe(true);
  });
});
