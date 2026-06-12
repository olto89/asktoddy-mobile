/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import TaskListScreen from '../TaskListScreen';
import { AIService } from '../../services/ai/AIServiceEdge';

// Mock AIService
jest.mock('../../services/ai/AIServiceEdge', () => ({
  AIService: {
    analyzeImage: jest.fn(),
  },
}));

// Mock QuoteStorageService
jest.mock('../../services/QuoteStorageService', () => ({
  quoteStorage: {
    save: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const baseSiteNotes = {
  id: 'test-quote-1',
  timestamp: Date.now(),
  address: '123 Test St, London',
  jobType: 'bathroom',
  propertyType: 'Semi-detached',
  size: '4m x 3m',
  tasks: ['Install shower', 'Replace tiles'],
  notes: 'Full bathroom renovation',
  photos: [],
  voiceNotes: '',
};

const fallbackResponse = {
  provider: 'fallback-template',
  _isFallback: true,
  confidence: 50,
  tasks: [
    {
      description: 'Template task',
      category: 'General',
      min_cost: 500,
      max_cost: 1000,
      materials: [],
      labor_days: 1,
    },
  ],
  summary: { confidence: 50 },
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
      materials: ['Shower unit', 'Pipes'],
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
  (AIService.analyzeImage as jest.Mock).mockReset();
});

describe('TaskListScreen retry button', () => {
  it('shows a no-numbers retry prompt when AI returns a fallback', async () => {
    (AIService.analyzeImage as jest.Mock).mockResolvedValueOnce(fallbackResponse);

    const { getByText, queryByText } = renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{
          params: {
            siteNotes: baseSiteNotes,
            isViewingGenerated: false,
          },
        }}
      />,
      {
        authContext: {
          freemiumUser: mockFreeUser,
          isAuthenticated: true,
          isAnonymous: false,
          canGenerateQuote: jest.fn(() => true),
          incrementQuoteUsage: jest.fn(() => Promise.resolve()),
        },
      }
    );

    await waitFor(() => {
      expect(getByText(/We couldn't build your quote/i)).toBeTruthy();
    });

    // Shows a retry prompt, NOT misleading template numbers
    expect(getByText('Try Again')).toBeTruthy();
    expect(queryByText(/Template task/i)).toBeNull();
  });

  it('does not show retry prompt when AI succeeds', async () => {
    (AIService.analyzeImage as jest.Mock).mockResolvedValueOnce(successResponse);

    const { queryByText } = renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{
          params: {
            siteNotes: baseSiteNotes,
            isViewingGenerated: false,
          },
        }}
      />,
      {
        authContext: {
          freemiumUser: mockFreeUser,
          isAuthenticated: true,
          isAnonymous: false,
          canGenerateQuote: jest.fn(() => true),
          incrementQuoteUsage: jest.fn(() => Promise.resolve()),
        },
      }
    );

    await waitFor(() => {
      expect(queryByText('Try Again')).toBeNull();
    });
  });

  it('retries AI analysis when retry button is pressed', async () => {
    // First call: fallback, second call: success
    (AIService.analyzeImage as jest.Mock)
      .mockResolvedValueOnce(fallbackResponse)
      .mockResolvedValueOnce(successResponse);

    const { getByText, queryByText } = renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{
          params: {
            siteNotes: baseSiteNotes,
            isViewingGenerated: false,
          },
        }}
      />,
      {
        authContext: {
          freemiumUser: mockFreeUser,
          isAuthenticated: true,
          isAnonymous: false,
          canGenerateQuote: jest.fn(() => true),
          incrementQuoteUsage: jest.fn(() => Promise.resolve()),
        },
      }
    );

    // Wait for the retry prompt
    await waitFor(() => {
      expect(getByText('Try Again')).toBeTruthy();
    });

    // Press retry
    fireEvent.press(getByText('Try Again'));

    // AI should be called again
    await waitFor(() => {
      expect(AIService.analyzeImage).toHaveBeenCalledTimes(2);
    });

    // Retry prompt should be gone after successful retry
    await waitFor(() => {
      expect(queryByText(/We couldn't build your quote/i)).toBeNull();
    });
  });

  // Scoping guards: the retry screen must ONLY appear for genuine
  // connectivity/timeout/server errors — not for valid quotes or auth/quota.

  it('shows a genuine low-confidence AI quote (does NOT treat it as a failure)', async () => {
    (AIService.analyzeImage as jest.Mock).mockResolvedValueOnce({
      provider: 'gemini-json',
      confidence: 55, // modest confidence, but a REAL quote
      tasks: [
        {
          description: 'Real low-confidence task',
          category: 'General',
          min_cost: 1000,
          max_cost: 2000,
          materials: [],
          labor_days: 1,
        },
      ],
      summary: { confidence: 55 },
    });

    const { getByText, queryByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Real low-confidence task')).toBeTruthy();
    });
    expect(queryByText(/We couldn't build your quote/i)).toBeNull();
  });

  it('routes a usage-limit (429) error to the upgrade modal, not the retry screen', async () => {
    const limitError = Object.assign(new Error('limit reached'), {
      code: 'USAGE_LIMIT_REACHED',
    });
    (AIService.analyzeImage as jest.Mock).mockRejectedValueOnce(limitError);

    const { getByText, queryByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Quote Limit Reached')).toBeTruthy();
    });
    expect(queryByText(/We couldn't build your quote/i)).toBeNull();
  });

  it('routes an auth (401) error to the login modal, not the retry screen', async () => {
    const authError = Object.assign(new Error('please sign in'), { code: 'AUTH_REQUIRED' });
    (AIService.analyzeImage as jest.Mock).mockRejectedValueOnce(authError);

    const { getByText, queryByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Sign Up to Generate Your Quote')).toBeTruthy();
    });
    expect(queryByText(/We couldn't build your quote/i)).toBeNull();
  });
});
