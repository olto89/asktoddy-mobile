import React from 'react';
import { renderWithProviders } from '../../../jest/test-utils';
import PrivacyPolicyScreen from '../PrivacyPolicyScreen';

describe('PrivacyPolicyScreen', () => {
  it('renders header and key sections', () => {
    const { getByText } = renderWithProviders(<PrivacyPolicyScreen />);

    expect(getByText('Privacy Policy')).toBeTruthy();
    expect(getByText('1. Introduction')).toBeTruthy();
    expect(getByText('2. Data We Collect')).toBeTruthy();
    expect(getByText('5. Third-Party Services')).toBeTruthy();
    expect(getByText('8. Your Rights')).toBeTruthy();
    expect(getByText('11. Contact Us')).toBeTruthy();
  });

  it('displays contact email', () => {
    const { getAllByText } = renderWithProviders(<PrivacyPolicyScreen />);

    expect(getAllByText('Email: support@asktoddy.com').length).toBeGreaterThan(0);
  });
});
