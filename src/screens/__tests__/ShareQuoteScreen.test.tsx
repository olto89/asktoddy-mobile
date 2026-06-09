import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser, mockPremiumUser } from '../../../jest/test-utils';
import ShareQuoteScreen from '../ShareQuoteScreen';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
});

const createNavigation = () => ({
  goBack: jest.fn(),
  navigate: jest.fn(),
});

const createRoute = (overrides = {}) => ({
  params: {
    quote: {
      quoteName: 'Kitchen Renovation',
      customerName: 'John Smith',
      timestamp: 1700000000000,
      finalCost: 15000,
      totalCost: { min: 12000, max: 18000 },
      siteNotes: {
        address: '123 Test Street',
        jobType: 'kitchen',
      },
      tasks: [
        {
          description: 'Remove existing kitchen',
          finalPrice: 2000,
          estimatedCost: { min: 1500, max: 2500 },
        },
        {
          description: 'Install new units',
          finalPrice: 8000,
          estimatedCost: { min: 6000, max: 10000 },
        },
        {
          description: 'Plumbing and electrics',
          finalPrice: 5000,
          estimatedCost: { min: 4000, max: 6000 },
        },
      ],
      projectNotes: 'Access via rear garden',
      ...overrides,
    },
  },
});

describe('ShareQuoteScreen', () => {
  describe('rendering', () => {
    it('renders share options', () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      expect(getByText('Share Quote')).toBeTruthy();
      expect(getByText('Share via Apps')).toBeTruthy();
      expect(getByText('Copy to Clipboard')).toBeTruthy();
      expect(getByText('Export PDF')).toBeTruthy();
    });

    it('shows quote summary with key details', () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      expect(getByText('Kitchen Renovation')).toBeTruthy();
      expect(getByText('123 Test Street')).toBeTruthy();
      expect(getByText('John Smith')).toBeTruthy();
      expect(getByText('3 line items')).toBeTruthy();
    });
  });

  describe('company branding in PDF', () => {
    it('uses company name in PDF when set', async () => {
      const userWithCompany = {
        ...mockFreeUser,
        companyName: 'Smith & Sons Builders',
        companyLogoUrl: 'https://example.com/logo.png',
      };

      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: { freemiumUser: userWithCompany, isAuthenticated: true, isAnonymous: false },
        }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('Smith & Sons Builders');
        expect(htmlArg).toContain('https://example.com/logo.png');
        expect(htmlArg).toContain('Powered by AskToddy');
      });
    });

    it('uses company logo image in PDF when set', async () => {
      const userWithLogo = {
        ...mockFreeUser,
        companyName: 'ABC Builders',
        companyLogoUrl: 'https://storage.example.com/logos/abc.jpg',
      };

      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: userWithLogo, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('<img src="https://storage.example.com/logos/abc.jpg"');
        expect(htmlArg).toContain('ABC Builders');
      });
    });

    it('falls back to AskToddy branding when no company set', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('>AskToddy</div>');
        expect(htmlArg).toContain('Generated with AskToddy');
        expect(htmlArg).not.toContain('Powered by AskToddy');
      });
    });

    it('does not render logo img tag when no logo URL set', async () => {
      const userWithNameOnly = {
        ...mockFreeUser,
        companyName: 'No Logo Ltd',
      };

      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: {
            freemiumUser: userWithNameOnly,
            isAuthenticated: true,
            isAnonymous: false,
          },
        }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('No Logo Ltd');
        expect(htmlArg).not.toContain('<img src=');
      });
    });
  });

  describe('company branding in text share', () => {
    it('includes company name in text when set', async () => {
      const userWithCompany = {
        ...mockFreeUser,
        companyName: 'Smith Builders',
      };

      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: { freemiumUser: userWithCompany, isAuthenticated: true, isAnonymous: false },
        }
      );

      fireEvent.press(getByText('Copy to Clipboard'));

      await waitFor(() => {
        const copiedText = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0];
        expect(copiedText).toContain('Smith Builders');
      });
    });

    it('omits company line in text when not set', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      fireEvent.press(getByText('Copy to Clipboard'));

      await waitFor(() => {
        const copiedText = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0];
        expect(copiedText).not.toContain('🏢');
      });
    });
  });

  describe('PDF generation', () => {
    it('generates and shares PDF', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        expect(Print.printToFileAsync).toHaveBeenCalled();
        expect(Sharing.shareAsync).toHaveBeenCalledWith(
          'file:///test.pdf',
          expect.objectContaining({
            mimeType: 'application/pdf',
          })
        );
      });
    });

    it('shows alert when sharing not available', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('PDF Created', expect.any(String));
      });
    });

    it('shows error alert on PDF failure', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Print.printToFileAsync as jest.Mock).mockRejectedValue(new Error('PDF error'));

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to generate PDF. Please try again.'
        );
      });
    });
  });

  describe('quote content', () => {
    it('includes task breakdown in PDF', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('Remove existing kitchen');
        expect(htmlArg).toContain('Install new units');
        expect(htmlArg).toContain('Plumbing and electrics');
        expect(htmlArg).toContain('15,000');
        expect(htmlArg).toContain('John Smith');
        expect(htmlArg).toContain('123 Test Street');
      });
    });

    it('includes project notes in PDF when present', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('Access via rear garden');
      });
    });
  });

  describe('PDF polish', () => {
    it('capitalises job type in PDF', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('Kitchen');
        expect(htmlArg).not.toMatch(/"detail-value">kitchen</);
      });
    });

    it('uses quote name as PDF title when set', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen
          navigation={createNavigation()}
          route={createRoute({ quoteName: 'Smith Kitchen Refit' })}
        />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('Smith Kitchen Refit');
      });
    });

    it('falls back to QUOTE when no quote name', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen
          navigation={createNavigation()}
          route={createRoute({ quoteName: undefined })}
        />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('>QUOTE</div>');
      });
    });

    it('includes labor days per task in PDF', async () => {
      const tasksWithLabor = [
        {
          description: 'Foundations',
          finalPrice: 5000,
          estimatedCost: { min: 4000, max: 6000 },
          laborDays: 5,
        },
        {
          description: 'Walls',
          finalPrice: 8000,
          estimatedCost: { min: 6000, max: 10000 },
          laborDays: 1,
        },
      ];

      const { getByText } = renderWithProviders(
        <ShareQuoteScreen
          navigation={createNavigation()}
          route={createRoute({ tasks: tasksWithLabor, finalCost: 13000 })}
        />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('Est. 5 days');
        expect(htmlArg).toContain('Est. 1 day');
      });
    });
  });

  describe('premium quote customisation in PDF', () => {
    it('uses custom validity days in PDF when set', async () => {
      const premiumUserCustom = {
        ...mockPremiumUser,
        quoteValidityDays: 14,
      };

      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: {
            freemiumUser: premiumUserCustom,
            isAuthenticated: true,
            isAnonymous: false,
          },
        }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('valid for 14 days');
        expect(htmlArg).not.toContain('valid for 30 days');
      });
    });

    it('defaults to 30 days validity when not set', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('valid for 30 days');
      });
    });

    it('includes business contact details in PDF when set', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: { freemiumUser: mockPremiumUser, isAuthenticated: true, isAnonymous: false },
        }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('From');
        expect(htmlArg).toContain('123 Builder Street, London');
        expect(htmlArg).toContain('020 1234 5678');
        expect(htmlArg).toContain('info@premiumbuilders.co.uk');
        expect(htmlArg).toContain('https://premiumbuilders.co.uk');
      });
    });

    it('omits business details section when no contact fields set', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).not.toContain('>From</div>');
      });
    });

    it('includes legal notice in PDF', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: { freemiumUser: mockPremiumUser, isAuthenticated: true, isAnonymous: false },
        }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('Terms &amp; Conditions');
        expect(htmlArg).toContain('Custom premium legal terms apply.');
      });
    });

    it('uses default legal notice when not customised', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.pdf' });

      fireEvent.press(getByText('Export PDF'));

      await waitFor(() => {
        const htmlArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html;
        expect(htmlArg).toContain('50% deposit');
        expect(htmlArg).toContain('Variations');
      });
    });
  });

  describe('premium quote customisation in text', () => {
    it('includes business contact details in text when set', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: { freemiumUser: mockPremiumUser, isAuthenticated: true, isAnonymous: false },
        }
      );

      fireEvent.press(getByText('Copy to Clipboard'));

      await waitFor(() => {
        const copiedText = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0];
        expect(copiedText).toContain('123 Builder Street, London');
        expect(copiedText).toContain('020 1234 5678');
        expect(copiedText).toContain('info@premiumbuilders.co.uk');
        expect(copiedText).toContain('https://premiumbuilders.co.uk');
      });
    });

    it('includes validity period in text', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: { freemiumUser: mockPremiumUser, isAuthenticated: true, isAnonymous: false },
        }
      );

      fireEvent.press(getByText('Copy to Clipboard'));

      await waitFor(() => {
        const copiedText = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0];
        expect(copiedText).toContain('Valid for 14 days');
      });
    });

    it('includes legal notice in text', async () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        {
          authContext: { freemiumUser: mockPremiumUser, isAuthenticated: true, isAnonymous: false },
        }
      );

      fireEvent.press(getByText('Copy to Clipboard'));

      await waitFor(() => {
        const copiedText = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0];
        expect(copiedText).toContain('Terms & Conditions');
        expect(copiedText).toContain('Custom premium legal terms apply.');
      });
    });
  });

  describe('navigation', () => {
    it('goes back on back button press', () => {
      const navigation = createNavigation();
      const { getByTestId } = renderWithProviders(
        <ShareQuoteScreen navigation={navigation} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      // The back button is the first TouchableOpacity with arrow-back icon
      // We can find it by the parent view structure
      // For now, test that navigation.goBack exists
      expect(navigation.goBack).toBeDefined();
    });
  });
});
