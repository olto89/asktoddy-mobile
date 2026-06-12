import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../jest/test-utils';
import { authHelpers } from '../../services/supabase';
import ForgotPasswordScreen from '../ForgotPasswordScreen';

jest.spyOn(Alert, 'alert');

const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ForgotPasswordScreen', () => {
  it('renders email input and submit button', () => {
    const navigation = createMockNavigation();

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <ForgotPasswordScreen navigation={navigation as any} route={{ params: {} } as any} />
    );

    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(getByText('Send Reset Link')).toBeTruthy();
  });

  it('pre-fills email from route params', () => {
    const navigation = createMockNavigation();

    const { getByPlaceholderText } = renderWithProviders(
      <ForgotPasswordScreen
        navigation={navigation as any}
        route={{ params: { email: 'user@test.com' } } as any}
      />
    );

    expect(getByPlaceholderText('your@email.com').props.value).toBe('user@test.com');
  });

  it('shows error when submitting with empty email', () => {
    const navigation = createMockNavigation();

    const { getByText } = renderWithProviders(
      <ForgotPasswordScreen navigation={navigation as any} route={{ params: {} } as any} />
    );

    fireEvent.press(getByText('Send Reset Link'));

    expect(Alert.alert).toHaveBeenCalledWith('Enter Email', expect.any(String));
  });

  it('shows error for invalid email format', () => {
    const navigation = createMockNavigation();

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <ForgotPasswordScreen navigation={navigation as any} route={{ params: {} } as any} />
    );

    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'not-an-email');
    fireEvent.press(getByText('Send Reset Link'));

    expect(Alert.alert).toHaveBeenCalledWith('Invalid Email', expect.any(String));
  });

  it('calls resetPassword and shows success state', async () => {
    (authHelpers.resetPassword as jest.Mock).mockResolvedValueOnce({ data: {}, error: null });
    const navigation = createMockNavigation();

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <ForgotPasswordScreen navigation={navigation as any} route={{ params: {} } as any} />
    );

    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    await waitFor(() => {
      expect(authHelpers.resetPassword).toHaveBeenCalledWith('user@example.com');
    });

    // Should show success state
    await waitFor(() => {
      expect(getByText(/check your email/i)).toBeTruthy();
      expect(getByText('Back to Sign In')).toBeTruthy();
    });
  });

  it('shows a friendly error alert when resetPassword fails with a real error', async () => {
    (authHelpers.resetPassword as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Internal server error', status: 500 },
    });
    const navigation = createMockNavigation();

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <ForgotPasswordScreen navigation={navigation as any} route={{ params: {} } as any} />
    );

    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    await waitFor(() => {
      // Friendly mapped message, not the raw error string
      expect(Alert.alert).toHaveBeenCalledWith('Something went wrong', expect.any(String));
    });
  });

  it('treats a rate-limit as success (email already sent) — no error alert', async () => {
    (authHelpers.resetPassword as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: {
        message: 'For security purposes, you can only request this after 49 seconds',
        status: 429,
      },
    });
    const navigation = createMockNavigation();

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <ForgotPasswordScreen navigation={navigation as any} route={{ params: {} } as any} />
    );

    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    // Shows the reassuring success state instead of an alarming error
    await waitFor(() => {
      expect(getByText(/check your email/i)).toBeTruthy();
      expect(getByText('Back to Sign In')).toBeTruthy();
    });
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('navigates back to Login when "Back to Sign In" is pressed', async () => {
    (authHelpers.resetPassword as jest.Mock).mockResolvedValueOnce({ data: {}, error: null });
    const navigation = createMockNavigation();

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <ForgotPasswordScreen navigation={navigation as any} route={{ params: {} } as any} />
    );

    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    await waitFor(() => {
      expect(getByText('Back to Sign In')).toBeTruthy();
    });

    fireEvent.press(getByText('Back to Sign In'));

    expect(navigation.goBack).toHaveBeenCalled();
  });
});
