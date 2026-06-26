/* eslint-disable @typescript-eslint/no-explicit-any */

// Feature 1: "Show material breakdown on customer PDF" checkbox on the
// generated-quote page. Verifies the toggle persists onto the quote and that
// the flag is threaded into the ShareQuote navigation (which drives the PDF).

import React from 'react';
import { waitFor, fireEvent } from '@testing-library/react-native';
import { renderWithProviders, mockFreeUser } from '../../../jest/test-utils';
import TaskListScreen from '../TaskListScreen';
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

const LABEL = 'Show material breakdown on customer PDF';

const generatedTasks = [
  {
    id: 'task-0',
    description: 'Bathroom fit-out',
    category: 'General',
    estimatedCost: { min: 4000, max: 6000 },
    finalPrice: 5000,
    materials: ['toilet', 'basin'],
    selected: true,
  },
];

const savedQuote: any = {
  id: 'q-1',
  status: 'generated',
  quoteName: 'Bathroom – Jones',
  address: '1 Test Rd',
  jobType: 'bathroom',
  generatedTasks,
  totalCost: { min: 4000, max: 6000 },
  finalCost: 5000,
};

const siteNotes = {
  id: 'q-1',
  address: '1 Test Rd',
  jobType: 'bathroom',
  propertyType: 'Flat',
  tasks: ['Fit bathroom'],
  notes: 'standard refit',
};

const authContext = {
  freemiumUser: mockFreeUser,
  isAuthenticated: true,
  isAnonymous: false,
  canGenerateQuote: jest.fn(() => true),
  incrementQuoteUsage: jest.fn(() => Promise.resolve()),
};

const renderGenerated = () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  const utils = renderWithProviders(
    <TaskListScreen
      navigation={navigation}
      route={{ params: { siteNotes, savedQuote, isViewingGenerated: true } }}
    />,
    { authContext }
  );
  return { ...utils, navigation };
};

beforeEach(() => {
  jest.clearAllMocks();
  (quoteStorage.save as jest.Mock).mockReset().mockResolvedValue(undefined);
});

describe('TaskListScreen — material breakdown checkbox', () => {
  it('renders the checkbox on the generated quote page', async () => {
    const { getByText } = renderGenerated();
    await waitFor(() => expect(getByText(LABEL)).toBeTruthy());
  });

  it('persists the preference onto the quote when toggled on', async () => {
    const { getByLabelText, getByText } = renderGenerated();
    await waitFor(() => expect(getByText(LABEL)).toBeTruthy());

    fireEvent.press(getByLabelText(LABEL));

    await waitFor(() =>
      expect(quoteStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'q-1', showMaterialBreakdown: true })
      )
    );
  });

  it('threads the flag into the ShareQuote navigation', async () => {
    const { getByLabelText, getByText, navigation } = renderGenerated();
    await waitFor(() => expect(getByText(LABEL)).toBeTruthy());

    fireEvent.press(getByLabelText(LABEL));
    fireEvent.press(getByText('Share Quote'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      'ShareQuote',
      expect.objectContaining({
        quote: expect.objectContaining({ showMaterialBreakdown: true }),
      })
    );
  });

  it('defaults the flag to false (PDF unchanged unless opted in)', async () => {
    const { getByText, navigation } = renderGenerated();
    await waitFor(() => expect(getByText('Share Quote')).toBeTruthy());

    fireEvent.press(getByText('Share Quote'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      'ShareQuote',
      expect.objectContaining({
        quote: expect.objectContaining({ showMaterialBreakdown: false }),
      })
    );
  });
});
