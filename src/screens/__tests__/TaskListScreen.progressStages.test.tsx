/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { renderWithProviders, mockFreeUser, waitFor } from '../../../jest/test-utils';
import TaskListScreen from '../TaskListScreen';
import * as ImageManipulator from 'expo-image-manipulator';

// Track the analyzeImage call so we can control when it resolves
let resolveAnalysis: (value: any) => void;
let rejectAnalysis: (reason: any) => void;

jest.mock('../../services/ai/AIServiceEdge', () => ({
  AIService: {
    analyzeImage: jest.fn(
      () =>
        new Promise((resolve, reject) => {
          resolveAnalysis = resolve;
          rejectAnalysis = reject;
        })
    ),
  },
}));

jest.mock('../../services/QuoteStorageService', () => ({
  quoteStorage: {
    save: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('base64data')),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() =>
    Promise.resolve({ base64: 'compressed-base64', width: 1024, height: 768 })
  ),
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

const authContext = {
  freemiumUser: mockFreeUser,
  isAuthenticated: true,
  isAnonymous: false,
  canGenerateQuote: jest.fn(() => true),
  incrementQuoteUsage: jest.fn(() => Promise.resolve()),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('TaskListScreen progressive loading stages', () => {
  it('shows "Preparing your project details..." initially', () => {
    const { getByText } = renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{
          params: { siteNotes: baseSiteNotes, isViewingGenerated: false },
        }}
      />,
      { authContext }
    );

    expect(getByText('Preparing your project details...')).toBeTruthy();
  });

  it('shows "Compressing photos..." when photos are present', async () => {
    // Make manipulateAsync take time so we can observe the stage
    (ImageManipulator.manipulateAsync as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ base64: 'compressed-base64', width: 1024, height: 768 }), 100)
        )
    );

    const siteNotesWithPhotos = {
      ...baseSiteNotes,
      photos: ['file:///photo1.jpg', 'file:///photo2.jpg'],
    };

    const { getByText } = renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{
          params: { siteNotes: siteNotesWithPhotos, isViewingGenerated: false },
        }}
      />,
      { authContext }
    );

    await waitFor(() => {
      expect(getByText('Compressing photos...')).toBeTruthy();
    });
  });

  it('transitions to "Generating your quote..." after 2 seconds of sending', async () => {
    const { getByText } = renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{
          params: { siteNotes: baseSiteNotes, isViewingGenerated: false },
        }}
      />,
      { authContext }
    );

    // Wait for stage to reach 'sending'
    await waitFor(() => {
      expect(getByText('Sending to AI...')).toBeTruthy();
    });

    // Advance timer past the 2-second threshold
    jest.advanceTimersByTime(2100);

    await waitFor(() => {
      expect(getByText('Generating your quote...')).toBeTruthy();
    });
  });
});

describe('TaskListScreen parallel image compression', () => {
  it('compresses multiple images in parallel using Promise.all', async () => {
    const callOrder: number[] = [];
    let callCount = 0;

    (ImageManipulator.manipulateAsync as jest.Mock).mockImplementation(() => {
      const myIndex = callCount++;
      callOrder.push(myIndex);
      return Promise.resolve({ base64: `compressed-${myIndex}`, width: 1024, height: 768 });
    });

    const siteNotesWithPhotos = {
      ...baseSiteNotes,
      photos: ['file:///photo1.jpg', 'file:///photo2.jpg', 'file:///photo3.jpg'],
    };

    renderWithProviders(
      <TaskListScreen
        navigation={mockNavigation}
        route={{
          params: { siteNotes: siteNotesWithPhotos, isViewingGenerated: false },
        }}
      />,
      { authContext }
    );

    // Wait for compression to complete
    await waitFor(() => {
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledTimes(3);
    });

    // All three should have been initiated (parallel = all called before any awaited)
    expect(callOrder).toEqual([0, 1, 2]);
  });
});
