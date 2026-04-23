import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../jest/test-utils';
import VerificationSuccessScreen from '../VerificationSuccessScreen';

const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
});

describe('VerificationSuccessScreen', () => {
  it('navigates to Main when user is already authenticated', () => {
    const navigation = createMockNavigation();

    const { getByText } = renderWithProviders(
      <VerificationSuccessScreen navigation={navigation as any} />,
      {
        authContext: {
          isAuthenticated: true,
          isAnonymous: false,
        },
      }
    );

    // Button should say "Continue to App"
    expect(getByText('Continue to App')).toBeTruthy();

    fireEvent.press(getByText('Continue to App'));

    expect(navigation.navigate).toHaveBeenCalledWith('Main');
  });

  it('navigates to Login when user is not authenticated', () => {
    const navigation = createMockNavigation();

    const { getByText } = renderWithProviders(
      <VerificationSuccessScreen navigation={navigation as any} />,
      {
        authContext: {
          isAuthenticated: false,
          isAnonymous: true,
        },
      }
    );

    // Button should say "Continue to Sign In"
    expect(getByText('Continue to Sign In')).toBeTruthy();

    fireEvent.press(getByText('Continue to Sign In'));

    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('shows verified email success message', () => {
    const navigation = createMockNavigation();

    const { getByText } = renderWithProviders(
      <VerificationSuccessScreen navigation={navigation as any} />
    );

    expect(getByText('Email Verified!')).toBeTruthy();
    expect(getByText(/all set/i)).toBeTruthy();
  });
});
