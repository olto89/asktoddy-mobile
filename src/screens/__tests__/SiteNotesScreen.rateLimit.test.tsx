import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, act } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import SiteNotesScreen from '../SiteNotesScreen';

jest.spyOn(Alert, 'alert');

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

describe('SiteNotesScreen — rate limiting', () => {
  it('blocks rapid double-tap on Generate Quote', () => {
    // Provide a valid existing quote so the form fields are populated
    // and canGenerateQuote() returns true
    const existingQuote = {
      id: 'rate-limit-test',
      address: '10 Test Street',
      jobType: 'bathroom',
      propertyType: 'Detached',
      size: '3m x 2m',
      tasks: ['Plumbing'],
      notes: 'Rate limit test',
      photos: [],
      voiceNotes: '',
    };

    const { getAllByText } = renderWithProviders(
      <SiteNotesScreen navigation={createNavigation()} route={createRoute({ existingQuote })} />,
      {
        authContext: {
          isAnonymous: false,
          isAuthenticated: true,
          freemiumUser: mockFreeUser,
          canGenerateQuote: jest.fn(() => true),
        },
      }
    );

    // Find the Generate Quote button text elements
    const buttons = getAllByText('Generate Quote');
    const generateButton = buttons[buttons.length - 1];

    // Use act to batch both presses before React re-renders
    act(() => {
      fireEvent.press(generateButton);
      fireEvent.press(generateButton);
    });

    // The second press should trigger the rate-limit alert
    expect(Alert.alert).toHaveBeenCalledWith(
      'Please Wait',
      'Please wait before generating another quote.'
    );
  });
});
