/**
 * ToddyAdviceCard — the four states and the cache/collapse behaviour.
 * The network call is injected via the `fetchAdvice` prop so no module mocking
 * is needed.
 */
import React from 'react';
import { renderWithProviders, fireEvent, waitFor, act } from '../../../jest/test-utils';
import ToddyAdviceCard from '../ToddyAdviceCard';
import type { ToddyAdvice, ToddyAdviceContext } from '../../services/ai/ToddyAdviceService';

const context: ToddyAdviceContext = {
  jobType: 'bathroom',
  lineItems: [{ description: 'Strip out', price: 800 }],
  quoteTotal: 14000,
};

const advice: ToddyAdvice = {
  winRange: { min: 12000, max: 14500 },
  rationale: 'pitched just under your total to stay competitive',
  tips: ['Use mid-range tiling', 'One skip for the whole job'],
};

describe('ToddyAdviceCard', () => {
  it('shows the call-to-action button in the idle state', () => {
    const { getByText, queryByText } = renderWithProviders(
      <ToddyAdviceCard context={context} fetchAdvice={jest.fn()} />
    );
    expect(getByText("Get Toddy's advice")).toBeTruthy();
    // No advice content yet.
    expect(queryByText(/winning range/i)).toBeNull();
  });

  it('shows a spinner while generating, then the framed advice', async () => {
    let resolve!: (a: ToddyAdvice) => void;
    const fetchAdvice = jest.fn(() => new Promise<ToddyAdvice>(r => (resolve = r)));

    const { getByText, queryByText } = renderWithProviders(
      <ToddyAdviceCard context={context} fetchAdvice={fetchAdvice} />
    );

    fireEvent.press(getByText("Get Toddy's advice"));
    expect(getByText("Toddy's thinking…")).toBeTruthy();

    await act(async () => {
      resolve(advice);
    });

    await waitFor(() => expect(getByText(/winning range for this job is/i)).toBeTruthy());
    // Range rendered with GBP formatting + en-dash split across <Text> nodes.
    expect(getByText(/£12,000/)).toBeTruthy();
    expect(getByText('Use mid-range tiling')).toBeTruthy();
    expect(getByText(/Guidance only/)).toBeTruthy();
    expect(queryByText("Toddy's thinking…")).toBeNull();
    expect(fetchAdvice).toHaveBeenCalledWith(context);
  });

  it('fires onAdviceGenerated once advice is produced', async () => {
    const onAdviceGenerated = jest.fn();
    const fetchAdvice = jest.fn().mockResolvedValue(advice);

    const { getByText } = renderWithProviders(
      <ToddyAdviceCard
        context={context}
        fetchAdvice={fetchAdvice}
        onAdviceGenerated={onAdviceGenerated}
      />
    );

    await act(async () => {
      fireEvent.press(getByText("Get Toddy's advice"));
    });

    await waitFor(() => expect(onAdviceGenerated).toHaveBeenCalledWith(advice));
  });

  it('shows a retryable error and does not crash when generation fails', async () => {
    const fetchAdvice = jest
      .fn()
      .mockRejectedValueOnce(new Error('Couldn’t load advice. Please try again.'))
      .mockResolvedValueOnce(advice);

    const { getByText } = renderWithProviders(
      <ToddyAdviceCard context={context} fetchAdvice={fetchAdvice} />
    );

    await act(async () => {
      fireEvent.press(getByText("Get Toddy's advice"));
    });

    await waitFor(() => expect(getByText(/Couldn.t load advice/)).toBeTruthy());

    // Retry succeeds.
    await act(async () => {
      fireEvent.press(getByText('Try again'));
    });
    await waitFor(() => expect(getByText(/winning range for this job is/i)).toBeTruthy());
  });

  it('renders cached advice collapsed (no button) and toggles open', () => {
    const fetchAdvice = jest.fn();
    const { getByText, queryByText } = renderWithProviders(
      <ToddyAdviceCard context={context} initialAdvice={advice} fetchAdvice={fetchAdvice} />
    );

    // Available but collapsed — no CTA, content hidden.
    expect(queryByText("Get Toddy's advice")).toBeNull();
    expect(queryByText(/winning range for this job is/i)).toBeNull();

    // Tapping the header expands it without any fetch.
    fireEvent.press(getByText("Toddy's advice"));
    expect(getByText(/winning range for this job is/i)).toBeTruthy();
    expect(fetchAdvice).not.toHaveBeenCalled();
  });
});
