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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TaskListScreen retry button', () => {
  it('shows retry button when AI falls back to templates', async () => {
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
      expect(getByText(/AI analysis temporarily unavailable/)).toBeTruthy();
    });

    expect(getByText('Retry with AI')).toBeTruthy();
  });

  it('does not show retry button when AI succeeds', async () => {
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
      expect(queryByText('Retry with AI')).toBeNull();
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

    // Wait for fallback banner
    await waitFor(() => {
      expect(getByText('Retry with AI')).toBeTruthy();
    });

    // Press retry
    fireEvent.press(getByText('Retry with AI'));

    // AI should be called again
    await waitFor(() => {
      expect(AIService.analyzeImage).toHaveBeenCalledTimes(2);
    });

    // Fallback banner should be gone after successful retry
    await waitFor(() => {
      expect(queryByText(/AI analysis temporarily unavailable/)).toBeNull();
    });
  });
});
