/* eslint-disable @typescript-eslint/no-explicit-any */

// The navigation header reads route.params.headerState (set here) so the title
// reflects reality: "Building Your Quote…" while generating, "Quote Generated"
// once done, and a neutral state on failure — not a premature "Quote Generated".

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

const makeNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
});

const baseSiteNotes = {
  id: 'q-1',
  timestamp: Date.now(),
  address: '1 Test St',
  jobType: 'bathroom',
  propertyType: 'Detached',
  size: '3m x 2m',
  tasks: ['Install shower'],
  notes: 'Renovation',
  photos: [],
  voiceNotes: '',
};

const successResponse = {
  provider: 'gemini-json',
  confidence: 85,
  tasks: [
    {
      description: 'Install shower',
      category: 'Plumbing',
      min_cost: 1000,
      max_cost: 2000,
      materials: ['Unit'],
      labor_days: 2,
    },
  ],
  summary: { confidence: 85, location_multiplier: 1.0, size_multiplier: 1.0 },
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

describe('TaskListScreen — header title state', () => {
  it('sets generating while the AI works, then generated when done', async () => {
    (AIService.analyzeImage as jest.Mock).mockResolvedValueOnce(successResponse);
    const navigation = makeNavigation();

    renderWithProviders(
      <TaskListScreen
        navigation={navigation}
        route={{ params: { siteNotes: baseSiteNotes, isViewingGenerated: false } }}
      />,
      { authContext }
    );

    // It shows "generating" at some point during processing.
    expect(navigation.setParams).toHaveBeenCalledWith({ headerState: 'generating' });

    // And settles on "generated" once the quote is built.
    await waitFor(() => {
      expect(navigation.setParams).toHaveBeenLastCalledWith({ headerState: 'generated' });
    });
  });

  it('uses generated immediately when viewing an existing quote (no AI call)', async () => {
    const navigation = makeNavigation();

    renderWithProviders(
      <TaskListScreen
        navigation={navigation}
        route={{
          params: {
            siteNotes: baseSiteNotes,
            savedQuote: { ...baseSiteNotes, generatedTasks: [], status: 'generated' },
            isViewingGenerated: true,
          },
        }}
      />,
      { authContext }
    );

    await waitFor(() => {
      expect(navigation.setParams).toHaveBeenCalledWith({ headerState: 'generated' });
    });
    expect(navigation.setParams).not.toHaveBeenCalledWith({ headerState: 'generating' });
    expect(AIService.analyzeImage).not.toHaveBeenCalled();
  });
});
