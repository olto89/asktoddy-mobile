import React from 'react';
import { waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import SiteNotesScreen from '../SiteNotesScreen';

const mockUseNetworkStatus = jest.fn();
jest.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

const createNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  dispatch: jest.fn(),
});

const createRoute = (params: Record<string, any> = {}) => ({
  params,
  name: 'SiteNotes',
});

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.clear as jest.Mock)();
  mockUseNetworkStatus.mockReturnValue({ isOnline: true, checkConnectivity: jest.fn() });
});

describe('SiteNotesScreen — offline indicator', () => {
  it('does NOT show offline banner when online', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true, checkConnectivity: jest.fn() });

    const { queryByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      {
        authContext: {
          isAnonymous: false,
          isAuthenticated: true,
          freemiumUser: mockFreeUser,
        },
      }
    );

    expect(queryByText(/Offline — your work is saved locally/)).toBeNull();
  });

  it('shows offline banner when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false, checkConnectivity: jest.fn() });

    const { getByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      {
        authContext: {
          isAnonymous: false,
          isAuthenticated: true,
          freemiumUser: mockFreeUser,
        },
      }
    );

    expect(getByText(/Offline — your work is saved locally/)).toBeTruthy();
  });

  it('does NOT show offline banner when status is unknown (null)', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: null, checkConnectivity: jest.fn() });

    const { queryByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      {
        authContext: {
          isAnonymous: false,
          isAuthenticated: true,
          freemiumUser: mockFreeUser,
        },
      }
    );

    expect(queryByText(/Offline — your work is saved locally/)).toBeNull();
  });

  it('shows "Saved" indicator after auto-save completes', async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true, checkConnectivity: jest.fn() });

    const { queryByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({
          existingQuote: {
            id: 'save-indicator-test',
            address: '10 Save Street',
            jobType: 'bathroom',
            propertyType: 'Detached',
            size: '3m x 2m',
            tasks: ['Tiling'],
            notes: 'Test save indicator',
            photos: [],
            voiceNotes: '',
          },
        })}
      />,
      {
        authContext: {
          isAnonymous: false,
          isAuthenticated: true,
          freemiumUser: mockFreeUser,
        },
      }
    );

    // Wait for auto-save debounce (1s) + async save to complete, then "Saved" text should appear
    await waitFor(
      () => {
        expect(queryByText('Saved')).toBeTruthy();
      },
      { timeout: 4000 }
    );
  });
});
