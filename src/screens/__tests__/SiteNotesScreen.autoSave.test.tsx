import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockAnonymousUser, mockFreeUser } from '../../../jest/test-utils';
import SiteNotesScreen from '../SiteNotesScreen';
import { quoteStorage } from '../../services/QuoteStorageService';

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
});

const createRoute = (params: Record<string, any> = {}) => ({
  params,
  name: 'SiteNotes',
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SiteNotesScreen auto-save', () => {
  it('does NOT auto-save drafts for anonymous users', async () => {
    renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: undefined })}
      />,
      {
        authContext: {
          isAnonymous: true,
          freemiumUser: mockAnonymousUser,
        },
      }
    );

    // Wait for any auto-save to potentially trigger
    await new Promise(resolve => setTimeout(resolve, 1500));

    expect(quoteStorage.save).not.toHaveBeenCalled();
  });

  it('auto-saves drafts for authenticated (free) users with data', async () => {
    renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({
          existingQuote: {
            id: 'test-quote-1',
            address: '123 Test Street',
            jobType: 'bathroom',
            propertyType: 'Detached',
            size: '3m x 2m',
            tasks: ['Plumbing'],
            notes: 'Test notes',
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

    // Wait for auto-save debounce (1 second) + some buffer
    await waitFor(
      () => {
        expect(quoteStorage.save).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });
});
