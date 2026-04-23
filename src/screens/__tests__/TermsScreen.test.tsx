import React from 'react';
import { renderWithProviders } from '../../../jest/test-utils';
import TermsScreen from '../TermsScreen';

describe('TermsScreen', () => {
  it('renders header and key sections', () => {
    const { getByText } = renderWithProviders(<TermsScreen />);

    expect(getByText('Terms & Conditions')).toBeTruthy();
    expect(getByText('1. Service Description')).toBeTruthy();
    expect(getByText('3. AI-Generated Quotes Disclaimer')).toBeTruthy();
    expect(getByText('7. Limitation of Liability')).toBeTruthy();
    expect(getByText('10. Governing Law')).toBeTruthy();
    expect(getByText('11. Contact Us')).toBeTruthy();
  });

  it('includes AI disclaimer text', () => {
    const { getByText } = renderWithProviders(<TermsScreen />);

    expect(getByText(/indicative estimates only/)).toBeTruthy();
  });
});
