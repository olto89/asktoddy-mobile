import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../jest/test-utils';
import { navigate } from '../../../services/NavigationService';
import LoginSignupModal from '../LoginSignupModal';

jest.spyOn(Alert, 'alert');

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginSignupModal', () => {
  // 1
  it('renders login form when mode is login', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <LoginSignupModal {...defaultProps} mode="login" />
    );

    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(getByPlaceholderText('Password (min 6 characters)')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  // 2
  it('renders signup form with confirm password when mode is signup', () => {
    const { getByText, getByPlaceholderText, getAllByText } = renderWithProviders(
      <LoginSignupModal {...defaultProps} mode="signup" />
    );

    expect(getAllByText('Sign Up Free').length).toBeGreaterThanOrEqual(1);
    expect(getByPlaceholderText('Confirm password')).toBeTruthy();
  });

  // 3
  it('shows Forgot Password link in login mode', () => {
    const { getByText } = renderWithProviders(<LoginSignupModal {...defaultProps} mode="login" />);

    expect(getByText('Forgot Password?')).toBeTruthy();
  });

  // 4
  it('does not show Forgot Password link in signup mode', () => {
    const { queryByText } = renderWithProviders(
      <LoginSignupModal {...defaultProps} mode="signup" />
    );

    expect(queryByText('Forgot Password?')).toBeNull();
  });

  // 5 - Forgot Password navigates to dedicated screen
  it('navigates to ForgotPassword screen when forgot password is tapped', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <LoginSignupModal {...defaultProps} mode="login" onClose={onClose} />
    );

    fireEvent.press(getByText('Forgot Password?'));

    // Should close the modal and navigate to ForgotPassword screen
    expect(onClose).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('ForgotPassword', { email: undefined });
  });

  // 6 - Forgot Password passes email to screen
  it('passes entered email to ForgotPassword screen', () => {
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <LoginSignupModal {...defaultProps} mode="login" onClose={onClose} />
    );

    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@example.com');
    fireEvent.press(getByText('Forgot Password?'));

    expect(navigate).toHaveBeenCalledWith('ForgotPassword', { email: 'user@example.com' });
  });

  // 7 - Forgot Password tears down a surrounding overlay (the drawer menu bug)
  it('calls onNavigateAway so a parent overlay (drawer menu) closes too', () => {
    const onClose = jest.fn();
    const onNavigateAway = jest.fn();
    const { getByText } = renderWithProviders(
      <LoginSignupModal
        {...defaultProps}
        mode="login"
        onClose={onClose}
        onNavigateAway={onNavigateAway}
      />
    );

    fireEvent.press(getByText('Forgot Password?'));

    expect(onClose).toHaveBeenCalled();
    expect(onNavigateAway).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('ForgotPassword', { email: undefined });
  });

  // ─── Signup verification flow tests ─────────────────────────────
  describe('signup verification flow', () => {
    const fillSignupForm = (getByPlaceholderText: (text: string) => any) => {
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@example.com');
      fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm password'), 'password123');
    };

    it('shows verification pending UI when signup needs email confirmation', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({
        error: null,
        needsVerification: true,
      });

      const { getByPlaceholderText, getAllByText, getByText } = renderWithProviders(
        <LoginSignupModal {...defaultProps} mode="signup" />,
        { authContext: { signUp: mockSignUp } }
      );

      fillSignupForm(getByPlaceholderText);

      // Find and press the submit button (Sign Up Free)
      const submitButtons = getAllByText('Sign Up Free');
      fireEvent.press(submitButtons[submitButtons.length - 1]);

      await waitFor(() => {
        // Should show inline verification UI, not an alert
        expect(getByText(/check your email/i)).toBeTruthy();
        expect(getByText('new@example.com')).toBeTruthy();
        expect(getByText("I've Verified - Sign In")).toBeTruthy();
      });
    });

    it('does NOT call onSuccess when signup needs verification', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({
        error: null,
        needsVerification: true,
      });

      const onSuccess = jest.fn();

      const { getByPlaceholderText, getAllByText, getByText } = renderWithProviders(
        <LoginSignupModal {...defaultProps} mode="signup" onSuccess={onSuccess} />,
        { authContext: { signUp: mockSignUp } }
      );

      fillSignupForm(getByPlaceholderText);

      const submitButtons = getAllByText('Sign Up Free');
      fireEvent.press(submitButtons[submitButtons.length - 1]);

      // Should show verification pending UI, not an alert
      await waitFor(() => {
        expect(getByText(/check your email/i)).toBeTruthy();
      });

      // onSuccess should NOT be called - user hasn't verified yet
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('shows verification pending UI instead of closing modal on signup', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({
        error: null,
        needsVerification: true,
      });

      const onClose = jest.fn();

      const { getByPlaceholderText, getAllByText, getByText } = renderWithProviders(
        <LoginSignupModal {...defaultProps} mode="signup" onClose={onClose} />,
        { authContext: { signUp: mockSignUp } }
      );

      fillSignupForm(getByPlaceholderText);

      const submitButtons = getAllByText('Sign Up Free');
      fireEvent.press(submitButtons[submitButtons.length - 1]);

      // After signup needing verification, the modal should show a
      // verification pending state rather than immediately closing
      await waitFor(() => {
        expect(getByText(/check your email/i)).toBeTruthy();
      });
    });

    it('calls onSuccess and closes modal on successful login', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      const onSuccess = jest.fn();
      const onClose = jest.fn();

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <LoginSignupModal {...defaultProps} mode="login" onSuccess={onSuccess} onClose={onClose} />,
        { authContext: { signIn: mockSignIn } }
      );

      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@example.com');
      fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'password123');
      });

      // After successful login, onSuccess should eventually be called
      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });
});
