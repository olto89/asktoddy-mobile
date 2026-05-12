/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import TaskListScreen from '../TaskListScreen';
import { AIService } from '../../services/ai/AIServiceEdge';

// Mock AIService — never resolves so we stay in processing state
jest.mock('../../services/ai/AIServiceEdge', () => ({
  AIService: {
    analyzeImage: jest.fn(() => new Promise(() => {})), // Never resolves
  },
}));

jest.mock('../../services/QuoteStorageService', () => ({
  quoteStorage: {
    save: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
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
  size: '4m x 3m (12.0m²)',
  tasks: ['Install shower'],
  notes: 'Full bathroom renovation',
  photos: [],
  voiceNotes: '',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TaskListScreen skeleton loading', () => {
  it('shows skeleton UI with status banner while processing', () => {
    const { getByText, getAllByTestId, queryByText } = renderWithProviders(
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

    // Should show the initial processing stage text
    expect(getByText('Preparing your project details...')).toBeTruthy();

    // Should NOT show the old "Analyzing Your Notes..." title
    expect(queryByText('Analyzing Your Notes...')).toBeNull();
    expect(queryByText('Extracting Tasks')).toBeNull();
  });

  it('does not show skeleton when viewing an existing quote', () => {
    const savedQuote = {
      id: 'saved-1',
      address: '123 Test St',
      jobType: 'bathroom',
      generatedTasks: [
        {
          id: 'task-0',
          description: 'Install shower',
          category: 'Plumbing',
          estimatedCost: { min: 500, max: 1000 },
          finalPrice: 1000,
          selected: true,
        },
      ],
      totalCost: { min: 500, max: 1000 },
    };

    const { queryByText, getByText } = renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{
          params: {
            siteNotes: baseSiteNotes,
            savedQuote,
            isViewingGenerated: true,
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

    // Should NOT show skeleton
    expect(queryByText('Preparing your project details...')).toBeNull();
    // Should show actual quote data
    expect(getByText('Install shower')).toBeTruthy();
  });
});
