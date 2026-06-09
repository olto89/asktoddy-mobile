import React from 'react';
import { Platform, Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import AppleSignInButton from '../AppleSignInButton';
import { authHelpers } from '../../services/supabase';

jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'ios';
});

describe('AppleSignInButton', () => {
  it('renders on iOS', () => {
    Platform.OS = 'ios';
    const { getByTestId } = render(<AppleSignInButton />);
    expect(getByTestId('apple-sign-in-button')).toBeTruthy();
  });

  it('returns null on Android', () => {
    Platform.OS = 'android';
    const { toJSON } = render(<AppleSignInButton />);
    expect(toJSON()).toBeNull();
  });

  it('calls signInAsync and signInWithApple on press', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: 'mock-apple-token',
      fullName: { givenName: 'Oliver', familyName: 'Todd' },
    });

    (authHelpers.signInWithApple as jest.Mock).mockResolvedValueOnce({
      data: { session: {}, user: {} },
      error: null,
    });

    const onSuccess = jest.fn();
    const { getByTestId } = render(<AppleSignInButton onSuccess={onSuccess} />);

    fireEvent.press(getByTestId('apple-sign-in-button'));

    await waitFor(() => {
      expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      expect(authHelpers.signInWithApple).toHaveBeenCalledWith('mock-apple-token');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error alert on sign-in failure', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: 'mock-apple-token',
    });

    (authHelpers.signInWithApple as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Auth failed' },
    });

    const onError = jest.fn();
    const { getByTestId } = render(<AppleSignInButton onError={onError} />);

    fireEvent.press(getByTestId('apple-sign-in-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sign In Failed', 'Auth failed');
      expect(onError).toHaveBeenCalled();
    });
  });

  it('does not alert on user cancellation', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValueOnce({
      code: 'ERR_REQUEST_CANCELED',
    });

    const onError = jest.fn();
    const { getByTestId } = render(<AppleSignInButton onError={onError} />);

    fireEvent.press(getByTestId('apple-sign-in-button'));

    await waitFor(() => {
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  it('throws when no identity token returned', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: null,
    });

    const onError = jest.fn();
    const { getByTestId } = render(<AppleSignInButton onError={onError} />);

    fireEvent.press(getByTestId('apple-sign-in-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign In Failed',
        'No identity token returned from Apple'
      );
      expect(onError).toHaveBeenCalled();
    });
  });
});
