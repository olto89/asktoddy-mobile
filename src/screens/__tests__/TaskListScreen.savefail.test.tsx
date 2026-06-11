/* eslint-disable @typescript-eslint/no-explicit-any */

// Tests for T8: the auto-save failure banner. When persisting a generated quote
// fails, the user should be told (instead of the error being swallowed) and be
// able to retry.

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import TaskListScreen from '../TaskListScreen';
import { AIService } from '../../services/ai/AIServiceEdge';
import { quoteStorage } from '../../services/QuoteStorageService';

jest.mock('../../services/ai/AIServiceEdge', () => ({
  AIService: { analyzeImage: jest.fn() },
}));

jest.mock('../../services/QuoteStorageService', () => ({
  quoteStorage: { save: jest.fn(() => Promise.resolve()) },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

const baseSiteNotes = {
  id: 'test-quote-1',
  timestamp: Date.now(),
  address: '123 Test St, London',
  jobType: 'bathroom',
  propertyType: 'Semi-detached',
  size: '4m x 3m',
  tasks: ['Install shower'],
  notes: 'Full bathroom renovation',
  photos: [],
  voiceNotes: '',
};

const successResponse = {
  provider: 'gemini-json',
  confidence: 85,
  tasks: [
    {
      description: 'Install new shower enclosure',
      category: 'Plumbing',
      min_cost: 1200,
      max_cost: 2500,
      materials: ['Shower unit'],
      labor_days: 2,
    },
  ],
  summary: { confidence: 85, location_multiplier: 1.1, size_multiplier: 1.0 },
};

const authContext = {
  freemiumUser: mockFreeUser,
  isAuthenticated: true,
  isAnonymous: false,
  canGenerateQuote: jest.fn(() => true),
  incrementQuoteUsage: jest.fn(() => Promise.resolve()),
};

function renderScreen() {
  return renderWithProviders(
    <TaskListScreen
      navigation={mockNavigation}
      route={{ params: { siteNotes: baseSiteNotes, isViewingGenerated: false } }}
    />,
    { authContext }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  // clearAllMocks resets call counts but NOT queued ...Once implementations,
  // so reset these explicitly to stop them leaking between tests.
  (quoteStorage.save as jest.Mock).mockReset().mockResolvedValue(undefined);
  (AIService.analyzeImage as jest.Mock).mockReset();
});

describe('TaskListScreen auto-save failure', () => {
  it('shows the save-error banner when saving fails', async () => {
    (AIService.analyzeImage as jest.Mock).mockResolvedValueOnce(successResponse);
    (quoteStorage.save as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText(/Couldn't save this quote to your device/i)).toBeTruthy();
    });
    expect(getByText('Retry save')).toBeTruthy();
  });

  it('clears the banner when a retried save succeeds', async () => {
    (AIService.analyzeImage as jest.Mock).mockResolvedValueOnce(successResponse);
    (quoteStorage.save as jest.Mock)
      .mockRejectedValueOnce(new Error('disk full'))
      .mockResolvedValueOnce(undefined);

    const { getByText, queryByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Retry save')).toBeTruthy();
    });

    fireEvent.press(getByText('Retry save'));

    // The retry triggers a second save which resolves and clears the banner.
    await waitFor(() => expect(quoteStorage.save).toHaveBeenCalledTimes(2));
    await waitFor(
      () => {
        expect(queryByText(/Couldn't save this quote to your device/i)).toBeNull();
      },
      { timeout: 3000 }
    );
  });

  it('does not show the banner when saving succeeds', async () => {
    (AIService.analyzeImage as jest.Mock).mockResolvedValueOnce(successResponse);

    const { queryByText } = renderScreen();

    await waitFor(() => {
      expect(queryByText(/Couldn't save this quote to your device/i)).toBeNull();
    });
  });
});
