/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import PricingScreen from '../PricingScreen';

// Control the subscription hook so we can assert the real purchase path fires
const mockPurchaseMonthly = jest.fn();
const mockRestorePurchases = jest.fn();
const mockClearError = jest.fn();
let mockHookState: any;

jest.mock('../../hooks/useSubscription', () => ({
  __esModule: true,
  default: () => mockHookState,
}));

const navigation = { goBack: jest.fn() };

describe('PricingScreen — premium purchase wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookState = {
      isLoading: false,
      isPremium: false,
      subscriptionStatus: null,
      offerings: null,
      monthlyPackage: {
        product: { priceString: '£9.99', identifier: 'asktoddy_pro_monthly' },
      },
      annualPackage: null,
      purchaseMonthly: mockPurchaseMonthly,
      purchaseAnnual: jest.fn(),
      purchasePackage: jest.fn(),
      restorePurchases: mockRestorePurchases,
      refreshStatus: jest.fn(),
      error: null,
      clearError: mockClearError,
    };
  });

  it('no longer shows a "coming soon" placeholder', () => {
    const { queryByText } = renderWithProviders(<PricingScreen navigation={navigation} />, {
      authContext: { freemiumUser: mockFreeUser },
    });
    expect(queryByText(/coming soon/i)).toBeNull();
  });

  it('shows the real RevenueCat price string', () => {
    const { getByText } = renderWithProviders(<PricingScreen navigation={navigation} />, {
      authContext: { freemiumUser: mockFreeUser },
    });
    expect(getByText('£9.99')).toBeTruthy();
  });

  it('fires a real purchase and refreshes premium status on success', async () => {
    mockPurchaseMonthly.mockResolvedValue(true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, mockAuth } = renderWithProviders(<PricingScreen navigation={navigation} />, {
      authContext: { freemiumUser: mockFreeUser },
    });

    fireEvent.press(getByText('Upgrade to Premium'));

    await waitFor(() => expect(mockPurchaseMonthly).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockAuth.refreshPremiumStatus).toHaveBeenCalledTimes(1));
    expect(alertSpy).toHaveBeenCalledWith(
      'Welcome to Premium!',
      expect.any(String),
      expect.anything()
    );
    alertSpy.mockRestore();
  });

  it('surfaces a purchase error and does not upgrade', async () => {
    mockPurchaseMonthly.mockResolvedValue(false);
    mockHookState.error = 'Card declined';
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, mockAuth } = renderWithProviders(<PricingScreen navigation={navigation} />, {
      authContext: { freemiumUser: mockFreeUser },
    });

    fireEvent.press(getByText('Upgrade to Premium'));

    await waitFor(() => expect(mockPurchaseMonthly).toHaveBeenCalledTimes(1));
    expect(mockAuth.refreshPremiumStatus).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Purchase Unsuccessful', 'Card declined');
    alertSpy.mockRestore();
  });

  it('restores purchases from the Restore button', async () => {
    mockRestorePurchases.mockResolvedValue(true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId, mockAuth } = renderWithProviders(
      <PricingScreen navigation={navigation} />,
      { authContext: { freemiumUser: mockFreeUser } }
    );

    fireEvent.press(getByTestId('restore-purchases-button'));

    await waitFor(() => expect(mockRestorePurchases).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockAuth.refreshPremiumStatus).toHaveBeenCalledTimes(1));
    alertSpy.mockRestore();
  });
});
