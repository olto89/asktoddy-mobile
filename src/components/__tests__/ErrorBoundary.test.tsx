import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../ErrorBoundary';

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

function GoodChild() {
  return <Text>Hello World</Text>;
}

function BadChild(): React.ReactElement {
  throw new Error('Test crash');
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('shows fallback UI when a child throws', () => {
    const { getByText, getByTestId } = render(
      <ErrorBoundary>
        <BadChild />
      </ErrorBoundary>
    );

    expect(getByText('AskToddy')).toBeTruthy();
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByTestId('error-boundary-retry')).toBeTruthy();
  });

  it('recovers when "Try Again" is pressed', () => {
    let shouldThrow = true;

    function ConditionalChild(): React.ReactElement {
      if (shouldThrow) {
        throw new Error('Test crash');
      }
      return <Text>Recovered</Text>;
    }

    const { getByTestId, getByText } = render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    );

    // Should show fallback
    expect(getByText('Something went wrong')).toBeTruthy();

    // Fix the error condition and press Try Again
    shouldThrow = false;
    fireEvent.press(getByTestId('error-boundary-retry'));

    // Should now render the child
    expect(getByText('Recovered')).toBeTruthy();
  });
});
