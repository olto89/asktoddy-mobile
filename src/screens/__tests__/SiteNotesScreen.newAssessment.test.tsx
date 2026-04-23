import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import SiteNotesScreen from '../SiteNotesScreen';
import { quoteStorage } from '../../services/QuoteStorageService';

// Mock useNetworkStatus
jest.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true, checkConnectivity: jest.fn() }),
}));

jest.mock('../../services/QuoteStorageService', () => ({
  quoteStorage: {
    save: jest.fn(() => Promise.resolve()),
    getAll: jest.fn(() => Promise.resolve([])),
    getById: jest.fn(() => Promise.resolve(null)),
    delete: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    syncToServer: jest.fn(() => Promise.resolve()),
    migrateAnonymousQuotes: jest.fn(() => Promise.resolve()),
    _invalidateCache: jest.fn(),
  },
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
});

describe('SiteNotesScreen — new assessment flow', () => {
  it('renders empty form when existingQuote is null (new assessment)', () => {
    const { getByPlaceholderText } = renderWithProviders(
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

    const addressInput = getByPlaceholderText('Enter property address...');
    expect(addressInput.props.value).toBe('');
  });

  it('populates form when existingQuote is provided', () => {
    const existingQuote = {
      id: 'existing-123',
      address: '42 Test Lane',
      jobType: 'bathroom',
      propertyType: 'Detached',
      size: '4m x 3m',
      tasks: ['Plumbing'],
      notes: 'Replace bath',
      photos: [],
      voiceNotes: '',
    };

    const { getByPlaceholderText } = renderWithProviders(
      <SiteNotesScreen navigation={createNavigation()} route={createRoute({ existingQuote })} />,
      {
        authContext: {
          isAnonymous: false,
          isAuthenticated: true,
          freemiumUser: mockFreeUser,
        },
      }
    );

    const addressInput = getByPlaceholderText('Enter property address...');
    expect(addressInput.props.value).toBe('42 Test Lane');
  });

  it('saves draft via QuoteStorageService on unmount when data exists', async () => {
    const existingQuote = {
      id: 'unmount-save-123',
      address: '99 Unmount Street',
      jobType: 'kitchen',
      propertyType: 'Terraced',
      size: '5m x 3m',
      tasks: ['Plumbing'],
      notes: 'Test unmount save',
      photos: [],
      voiceNotes: '',
    };

    const { unmount } = renderWithProviders(
      <SiteNotesScreen navigation={createNavigation()} route={createRoute({ existingQuote })} />,
      {
        authContext: {
          isAnonymous: false,
          isAuthenticated: true,
          freemiumUser: mockFreeUser,
        },
      }
    );

    // Unmount the component — should trigger the unmount-save effect
    unmount();

    // Give the fire-and-forget async save time to complete
    await waitFor(
      () => {
        expect(quoteStorage.save).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Verify the saved data contains the right quote
    const lastCall = (quoteStorage.save as jest.Mock).mock.calls.find(
      (args: any[]) => args[0]?.id === 'unmount-save-123'
    );
    expect(lastCall).toBeDefined();
    expect(lastCall[0].address).toBe('99 Unmount Street');
  });

  it('does NOT save on unmount for anonymous users', async () => {
    const { unmount } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({
          existingQuote: {
            id: 'anon-test',
            address: 'test',
            jobType: 'bathroom',
            tasks: [],
            notes: '',
            photos: [],
            voiceNotes: '',
          },
        })}
      />,
      {
        authContext: {
          isAnonymous: true,
        },
      }
    );

    unmount();

    // Give time for any potential async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Anonymous users: no auto-save and no unmount-save
    expect(quoteStorage.save).not.toHaveBeenCalled();
  });
});
