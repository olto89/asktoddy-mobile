/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import SiteNotesScreen from '../SiteNotesScreen';

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

const defaultAuthContext = {
  isAnonymous: false,
  isAuthenticated: true,
  freemiumUser: mockFreeUser,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SiteNotesScreen — structured size input', () => {
  it('renders structured size inputs (length × width) by default', () => {
    const { getByText, getAllByPlaceholderText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      { authContext: defaultAuthContext }
    );

    expect(getByText('Length')).toBeTruthy();
    expect(getByText('Width')).toBeTruthy();
    expect(getByText('×')).toBeTruthy();
    // Two "0" placeholder inputs for length and width
    expect(getAllByPlaceholderText('0')).toHaveLength(2);
  });

  it('shows free text mode when "Irregular shape?" is tapped', () => {
    const { getByText, queryByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      { authContext: defaultAuthContext }
    );

    fireEvent.press(getByText('Irregular shape?'));

    // Should now show free text input toggle
    expect(getByText('Use dimensions')).toBeTruthy();
    // Structured labels should be gone
    expect(queryByText('Length')).toBeNull();
  });

  it('calculates area when both dimensions are entered', () => {
    const { getAllByPlaceholderText, getByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      { authContext: defaultAuthContext }
    );

    const [lengthInput, widthInput] = getAllByPlaceholderText('0');
    fireEvent.changeText(lengthInput, '4');
    fireEvent.changeText(widthInput, '3');

    expect(getByText('= 12.0m²')).toBeTruthy();
  });
});

describe('SiteNotesScreen — spec level picker', () => {
  it('renders all four spec level options', () => {
    const { getByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      { authContext: defaultAuthContext }
    );

    expect(getByText('Budget')).toBeTruthy();
    expect(getByText('Standard')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('Luxury')).toBeTruthy();
  });

  it('renders Finish Level label', () => {
    const { getByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({ existingQuote: null })}
      />,
      { authContext: defaultAuthContext }
    );

    expect(getByText('Finish Level')).toBeTruthy();
  });
});

describe('SiteNotesScreen — rooms/floors input', () => {
  it('shows rooms stepper when extension is selected', () => {
    const { getByText, queryByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({
          existingQuote: {
            id: 'test',
            address: 'test',
            jobType: 'extension',
            tasks: [],
            notes: '',
            photos: [],
            voiceNotes: '',
          },
        })}
      />,
      { authContext: defaultAuthContext }
    );

    expect(getByText('Number of Rooms')).toBeTruthy();
    expect(getByText('Number of Floors')).toBeTruthy();
  });

  it('shows rooms stepper for renovation but not floors', () => {
    const { getByText, queryByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({
          existingQuote: {
            id: 'test',
            address: 'test',
            jobType: 'renovation',
            tasks: [],
            notes: '',
            photos: [],
            voiceNotes: '',
          },
        })}
      />,
      { authContext: defaultAuthContext }
    );

    expect(getByText('Number of Rooms')).toBeTruthy();
    expect(queryByText('Number of Floors')).toBeNull();
  });

  it('does not show rooms for bathroom job type', () => {
    const { queryByText } = renderWithProviders(
      <SiteNotesScreen
        navigation={createNavigation()}
        route={createRoute({
          existingQuote: {
            id: 'test',
            address: 'test',
            jobType: 'bathroom',
            tasks: [],
            notes: '',
            photos: [],
            voiceNotes: '',
          },
        })}
      />,
      { authContext: defaultAuthContext }
    );

    expect(queryByText('Number of Rooms')).toBeNull();
  });
});
