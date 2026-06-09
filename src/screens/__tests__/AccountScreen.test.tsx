import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser, mockPremiumUser } from '../../../jest/test-utils';
import AccountScreen from '../AccountScreen';
import { dbHelpers } from '../../services/supabase';
import * as ImageManipulator from 'expo-image-manipulator';

jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
});

const mockUser = {
  id: 'user_test_456',
  email: 'test@example.com',
  created_at: '2025-01-01T00:00:00.000Z',
  user_metadata: {},
};

describe('AccountScreen', () => {
  it('renders user info and account settings', () => {
    const { getByText } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: mockFreeUser,
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    expect(getByText('My Account')).toBeTruthy();
    expect(getByText('Account Settings')).toBeTruthy();
    expect(getByText('Company Branding')).toBeTruthy();
    expect(getByText('Change Password')).toBeTruthy();
  });

  it('expands company branding section on tap', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: mockFreeUser,
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    // Section should be collapsed initially
    expect(queryByTestId('company-branding-section')).toBeNull();

    // Tap to expand
    fireEvent.press(getByTestId('company-branding-toggle'));

    // Section should now be visible
    expect(getByTestId('company-branding-section')).toBeTruthy();
    expect(getByTestId('company-name-input')).toBeTruthy();
    expect(getByTestId('logo-picker-button')).toBeTruthy();
  });

  it('shows company name input pre-filled from freemiumUser', () => {
    const { getByTestId } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: { ...mockFreeUser, companyName: 'Toddy Builders' },
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    fireEvent.press(getByTestId('company-branding-toggle'));

    const input = getByTestId('company-name-input');
    expect(input.props.value).toBe('Toddy Builders');
  });

  it('calls updateCompanyProfile when saving company name', async () => {
    const { getByTestId, mockAuth } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: mockFreeUser,
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    fireEvent.press(getByTestId('company-branding-toggle'));

    const input = getByTestId('company-name-input');
    fireEvent.changeText(input, 'New Company');

    fireEvent.press(getByTestId('save-company-name-button'));

    await waitFor(() => {
      expect(mockAuth.updateCompanyProfile).toHaveBeenCalledWith({ companyName: 'New Company' });
    });
  });

  it('shows logo image when companyLogoUrl is set', () => {
    const { getByTestId } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: {
          ...mockFreeUser,
          companyLogoUrl: 'https://example.com/logo.jpg',
        },
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    fireEvent.press(getByTestId('company-branding-toggle'));

    expect(getByTestId('company-logo-image')).toBeTruthy();
    expect(getByTestId('remove-logo-button')).toBeTruthy();
  });

  it('renders Delete Account option and shows confirmation alert on tap', () => {
    const { getByTestId } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: mockFreeUser,
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    const deleteButton = getByTestId('delete-account-button');
    expect(deleteButton).toBeTruthy();

    fireEvent.press(deleteButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete Account', style: 'destructive' }),
      ])
    );
  });

  it('shows placeholder icon when no logo is set', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: mockFreeUser,
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    fireEvent.press(getByTestId('company-branding-toggle'));

    expect(queryByTestId('company-logo-image')).toBeNull();
    expect(queryByTestId('remove-logo-button')).toBeNull();
  });

  it('calls deleteAccount when user confirms deletion', async () => {
    const { getByTestId, mockAuth } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: mockFreeUser,
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    fireEvent.press(getByTestId('delete-account-button'));

    // Simulate pressing the destructive "Delete Account" button in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const deleteButton = buttons.find((b: any) => b.text === 'Delete Account');
    await act(async () => {
      await deleteButton.onPress();
    });

    await waitFor(() => {
      expect(mockAuth.deleteAccount).toHaveBeenCalled();
    });
  });

  it('calls deleteStorageFile for both formats then updateCompanyProfile when removing logo', async () => {
    const { getByTestId, mockAuth } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: {
          ...mockFreeUser,
          companyLogoUrl: 'https://example.com/logo.jpg',
        },
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    fireEvent.press(getByTestId('company-branding-toggle'));
    fireEvent.press(getByTestId('remove-logo-button'));

    await waitFor(() => {
      expect(dbHelpers.deleteStorageFile).toHaveBeenCalledWith(
        'company-logos',
        `${mockUser.id}/logo.jpg`
      );
      expect(dbHelpers.deleteStorageFile).toHaveBeenCalledWith(
        'company-logos',
        `${mockUser.id}/logo.png`
      );
      expect(mockAuth.updateCompanyProfile).toHaveBeenCalledWith({ companyLogoUrl: null });
    });
  });

  it('converts picked image to JPEG via ImageManipulator before uploading', async () => {
    const { getByTestId } = renderWithProviders(<AccountScreen />, {
      authContext: {
        user: mockUser,
        freemiumUser: mockFreeUser,
        isAuthenticated: true,
        isAnonymous: false,
      },
    });

    fireEvent.press(getByTestId('company-branding-toggle'));
    fireEvent.press(getByTestId('logo-picker-button'));

    await waitFor(() => {
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'mock://image.jpg',
        [{ resize: { width: 512 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      // Should always upload as .jpg regardless of source format
      expect(dbHelpers.uploadImage).toHaveBeenCalledWith(
        'mock://manipulated.jpeg',
        `${mockUser.id}/logo.jpg`,
        'company-logos'
      );
    });
  });

  describe('premium quote settings', () => {
    it('shows PRO badge for free users', () => {
      const { getByTestId } = renderWithProviders(<AccountScreen />, {
        authContext: {
          user: mockUser,
          freemiumUser: mockFreeUser,
          isAuthenticated: true,
          isAnonymous: false,
          isPremium: false,
        },
      });

      fireEvent.press(getByTestId('company-branding-toggle'));

      expect(getByTestId('pro-badge')).toBeTruthy();
      expect(getByTestId('quote-validity-input')).toBeTruthy();
    });

    it('does not show PRO badge for premium users', () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<AccountScreen />, {
        authContext: {
          user: mockUser,
          freemiumUser: mockPremiumUser,
          isAuthenticated: true,
          isAnonymous: false,
          isPremium: true,
        },
      });

      fireEvent.press(getByTestId('company-branding-toggle'));

      expect(queryByTestId('pro-badge')).toBeNull();
    });

    it('locks inputs for free users', () => {
      const { getByTestId } = renderWithProviders(<AccountScreen />, {
        authContext: {
          user: mockUser,
          freemiumUser: mockFreeUser,
          isAuthenticated: true,
          isAnonymous: false,
          isPremium: false,
        },
      });

      fireEvent.press(getByTestId('company-branding-toggle'));

      expect(getByTestId('quote-validity-input').props.editable).toBe(false);
      expect(getByTestId('business-address-input').props.editable).toBe(false);
      expect(getByTestId('business-phone-input').props.editable).toBe(false);
      expect(getByTestId('business-email-input').props.editable).toBe(false);
      expect(getByTestId('business-website-input').props.editable).toBe(false);
      expect(getByTestId('legal-notice-input').props.editable).toBe(false);
    });

    it('unlocks inputs for premium users', () => {
      const { getByTestId } = renderWithProviders(<AccountScreen />, {
        authContext: {
          user: mockUser,
          freemiumUser: mockPremiumUser,
          isAuthenticated: true,
          isAnonymous: false,
          isPremium: true,
        },
      });

      fireEvent.press(getByTestId('company-branding-toggle'));

      expect(getByTestId('quote-validity-input').props.editable).toBe(true);
      expect(getByTestId('business-address-input').props.editable).toBe(true);
    });

    it('does not show save button for free users', () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<AccountScreen />, {
        authContext: {
          user: mockUser,
          freemiumUser: mockFreeUser,
          isAuthenticated: true,
          isAnonymous: false,
          isPremium: false,
        },
      });

      fireEvent.press(getByTestId('company-branding-toggle'));

      expect(queryByTestId('save-quote-settings-button')).toBeNull();
    });

    it('shows save button for premium users and saves settings', async () => {
      const { getByTestId, mockAuth } = renderWithProviders(<AccountScreen />, {
        authContext: {
          user: mockUser,
          freemiumUser: mockPremiumUser,
          isAuthenticated: true,
          isAnonymous: false,
          isPremium: true,
        },
      });

      fireEvent.press(getByTestId('company-branding-toggle'));

      const saveButton = getByTestId('save-quote-settings-button');
      expect(saveButton).toBeTruthy();

      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockAuth.updateCompanyProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            quoteValidityDays: 14,
            businessAddress: '123 Builder Street, London',
            businessPhone: '020 1234 5678',
            businessEmail: 'info@premiumbuilders.co.uk',
            businessWebsite: 'https://premiumbuilders.co.uk',
            legalNotice: 'Custom premium legal terms apply.',
          })
        );
      });
    });

    it('pre-fills premium fields from freemiumUser', () => {
      const { getByTestId } = renderWithProviders(<AccountScreen />, {
        authContext: {
          user: mockUser,
          freemiumUser: mockPremiumUser,
          isAuthenticated: true,
          isAnonymous: false,
          isPremium: true,
        },
      });

      fireEvent.press(getByTestId('company-branding-toggle'));

      expect(getByTestId('quote-validity-input').props.value).toBe('14');
      expect(getByTestId('business-address-input').props.value).toBe('123 Builder Street, London');
      expect(getByTestId('business-phone-input').props.value).toBe('020 1234 5678');
      expect(getByTestId('business-email-input').props.value).toBe('info@premiumbuilders.co.uk');
      expect(getByTestId('business-website-input').props.value).toBe(
        'https://premiumbuilders.co.uk'
      );
      expect(getByTestId('legal-notice-input').props.value).toBe(
        'Custom premium legal terms apply.'
      );
    });
  });
});
