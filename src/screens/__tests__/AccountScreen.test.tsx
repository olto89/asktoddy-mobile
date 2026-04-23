import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import AccountScreen from '../AccountScreen';
import { dbHelpers } from '../../services/supabase';

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
      expect(mockAuth.updateCompanyProfile).toHaveBeenCalledWith('New Company');
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

  it('calls deleteStorageFile then updateCompanyProfile when removing logo', async () => {
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
      expect(mockAuth.updateCompanyProfile).toHaveBeenCalledWith(undefined, null);
    });
  });
});
