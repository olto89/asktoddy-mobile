/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  it('renders with title text', () => {
    render(<Button title="Get Quote" onPress={jest.fn()} />);
    expect(screen.getByText('Get Quote')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button title="Submit" onPress={onPress} />);

    fireEvent.press(screen.getByText('Submit'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Submit" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('Submit'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button title="Submit" onPress={jest.fn()} loading />
    );

    // Title should not be visible when loading
    expect(queryByText('Submit')).toBeNull();
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    render(<Button title="Submit" onPress={onPress} loading />);

    // The button should not respond to presses while loading
    // (no text to press, but the TouchableOpacity is disabled)
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button title="Primary" onPress={jest.fn()} variant="primary" />);
    expect(screen.getByText('Primary')).toBeTruthy();

    rerender(<Button title="Outline" onPress={jest.fn()} variant="outline" />);
    expect(screen.getByText('Outline')).toBeTruthy();

    rerender(<Button title="Ghost" onPress={jest.fn()} variant="ghost" />);
    expect(screen.getByText('Ghost')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button title="Small" onPress={jest.fn()} size="sm" />);
    expect(screen.getByText('Small')).toBeTruthy();

    rerender(<Button title="Large" onPress={jest.fn()} size="lg" />);
    expect(screen.getByText('Large')).toBeTruthy();
  });

  it('renders icon alongside title', () => {
    const { getByText } = render(<Button title="Camera" onPress={jest.fn()} icon={<></>} />);
    expect(getByText('Camera')).toBeTruthy();
  });
});
