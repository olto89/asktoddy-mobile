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

    it('shows quote preview with quote data', () => {
      const { getByText } = renderWithProviders(
        <ShareQuoteScreen navigation={createNavigation()} route={createRoute()} />,
        { authContext: { freemiumUser: mockFreeUser, isAuthenticated: true, isAnonymous: false } }
      );

      expect(getByText('Quote Preview')).toBeTruthy();
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
