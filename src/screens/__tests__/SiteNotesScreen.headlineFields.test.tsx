import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import SiteNotesScreen from '../SiteNotesScreen';
import { quoteStorage } from '../../services/QuoteStorageService';

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

const createRoute = (params: Record<string, any> = {}) => ({ params, name: 'SiteNotes' });

const authContext = {
  isAnonymous: false,
  isAuthenticated: true,
  freemiumUser: mockFreeUser,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SiteNotesScreen — headline fields (quote name + customer name)', () => {
  it('renders both headline inputs, empty, on a new assessment', () => {
    const { getByTestId } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      { authContext }
    );

    expect(getByTestId('quote-name-input').props.value).toBe('');
    expect(getByTestId('customer-name-input').props.value).toBe('');
  });

  it('pre-fills both fields from an existing quote', () => {
    const existingQuote = {
      id: 'q-1',
      quoteName: 'Kitchen Extension – Smith',
      customerName: 'Jane Smith',
      address: '12 Oak Rd',
      jobType: 'extension',
      propertyType: 'Detached',
      size: '5m x 4m',
      tasks: [],
      notes: '',
      photos: [],
      voiceNotes: '',
    };

    const { getByTestId } = renderWithProviders(
      <SiteNotesScreen navigation={createNavigation()} route={createRoute({ existingQuote })} />,
      { authContext }
    );

    expect(getByTestId('quote-name-input').props.value).toBe('Kitchen Extension – Smith');
    expect(getByTestId('customer-name-input').props.value).toBe('Jane Smith');
  });

  it('persists edited headline values to the saved draft', async () => {
    const { getByTestId } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({
          existingQuote: {
            id: 'q-2',
            address: '1 High St',
            jobType: 'bathroom',
            propertyType: 'Detached',
            size: '3m x 2m',
            tasks: ['Plumbing'],
            notes: 'x',
            photos: [],
            voiceNotes: '',
          },
        })}
      />,
      { authContext }
    );

    fireEvent.changeText(getByTestId('quote-name-input'), 'Bathroom Refit – Jones');
    fireEvent.changeText(getByTestId('customer-name-input'), 'Bob Jones');

    await waitFor(
      () => {
        expect(quoteStorage.save).toHaveBeenCalledWith(
          expect.objectContaining({
            quoteName: 'Bathroom Refit – Jones',
            customerName: 'Bob Jones',
          })
        );
      },
      { timeout: 3000 }
    );
  });
});
