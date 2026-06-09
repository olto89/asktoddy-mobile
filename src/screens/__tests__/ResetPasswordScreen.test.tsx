import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import ResetPasswordScreen from '../ResetPasswordScreen';
import { supabase } from '../../services/supabase';

jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
});

const createNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
});

describe('ResetPasswordScreen', () => {
  it('renders password reset form', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <ResetPasswordScreen navigation={createNavigation()} />,
      { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
    );

    expect(getByText('Create New Password')).toBeTruthy();
    expect(getByPlaceholderText('Min 6 characters')).toBeTruthy();
    expect(getByPlaceholderText('Confirm new password')).toBeTruthy();
    expect(getByText('Reset Password')).toBeTruthy();
  });

  it('shows error when password is empty', async () => {
    const { getByText } = renderWithProviders(
      <ResetPasswordScreen navigation={createNavigation()} />,
      { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
    );

    fireEvent.press(getByText('Reset Password'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a new password.');
    });
  });

  it('shows error when password is too short', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <ResetPasswordScreen navigation={createNavigation()} />,
      { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
    );

    fireEvent.changeText(getByPlaceholderText('Min 6 characters'), '12345');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), '12345');
    fireEvent.press(getByText('Reset Password'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 6 characters.');
    });
  });

  it('shows error when passwords do not match', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <ResetPasswordScreen navigation={createNavigation()} />,
      { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
    );

    fireEvent.changeText(getByPlaceholderText('Min 6 characters'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'different123');
    fireEvent.press(getByText('Reset Password'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match.');
    });
  });

  it('calls updateUser and shows success on valid submission', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
      data: { user: {} },
      error: null,
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <ResetPasswordScreen navigation={createNavigation()} />,
      { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
    );

    fireEvent.changeText(getByPlaceholderText('Min 6 characters'), 'newpassword123');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'newpassword123');
    fireEvent.press(getByText('Reset Password'));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
      expect(getByText('Password Updated')).toBeTruthy();
      expect(getByText('Continue to App')).toBeTruthy();
    });
  });

  it('navigates to Main on success button press', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
      data: { user: {} },
      error: null,
    });

    const navigation = createNavigation();
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <ResetPasswordScreen navigation={navigation} />,
      { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
    );

    fireEvent.changeText(getByPlaceholderText('Min 6 characters'), 'newpassword123');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'newpassword123');
    fireEvent.press(getByText('Reset Password'));

    await waitFor(() => {
      expect(getByText('Continue to App')).toBeTruthy();
    });

    fireEvent.press(getByText('Continue to App'));
    expect(navigation.navigate).toHaveBeenCalledWith('Main');
  });

  it('shows error when updateUser fails', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Token expired' },
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <ResetPasswordScreen navigation={createNavigation()} />,
      { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
    );

    fireEvent.changeText(getByPlaceholderText('Min 6 characters'), 'newpassword123');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'newpassword123');
    fireEvent.press(getByText('Reset Password'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Token expired');
    });
  });
});
