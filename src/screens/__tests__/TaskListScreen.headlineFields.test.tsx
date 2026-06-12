/* eslint-disable @typescript-eslint/no-explicit-any */

// Verifies the headline fields captured on the assessment form (quoteName,
// customerName) are threaded onto the saved GENERATED quote at the top level,
// where the PDF/share header reads them (quote.quoteName / quote.customerName).

import React from 'react';
import { waitFor } from '@testing-library/react-native';
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

const siteNotesWithHeadline = {
  id: 'test-quote-1',
  timestamp: Date.now(),
  quoteName: 'Kitchen Extension – Smith',
  customerName: 'Jane Smith',
  address: '12 Oak Rd, Bristol',
  jobType: 'extension',
  propertyType: 'Detached',
  size: '5m x 4m',
  tasks: ['Build extension'],
  notes: 'Single-storey rear extension',
  photos: [],
  voiceNotes: '',
};

const successResponse = {
  provider: 'gemini-json',
  confidence: 85,
  tasks: [
    {
      description: 'Foundations and groundwork',
      category: 'Structural',
      min_cost: 8000,
      max_cost: 12000,
      materials: ['Concrete'],
      labor_days: 5,
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

beforeEach(() => {
  jest.clearAllMocks();
  (quoteStorage.save as jest.Mock).mockReset().mockResolvedValue(undefined);
  (AIService.analyzeImage as jest.Mock).mockReset();
});

describe('TaskListScreen — headline fields on generated quote', () => {
  it('saves quoteName and customerName at the top level of the generated quote', async () => {
    (AIService.analyzeImage as jest.Mock).mockResolvedValueOnce(successResponse);

    renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{ params: { siteNotes: siteNotesWithHeadline, isViewingGenerated: false } }}
      />,
      { authContext }
    );

    await waitFor(() => {
      expect(quoteStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quoteName: 'Kitchen Extension – Smith',
          customerName: 'Jane Smith',
          status: 'generated',
        })
      );
    });
  });
});
