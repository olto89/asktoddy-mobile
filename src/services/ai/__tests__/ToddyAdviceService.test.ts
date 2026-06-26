/**
 * Tests for ToddyAdviceService:
 * - POST to the toddy-advice edge function with the logged-in user's token
 * - falls back to the anon key when there is no session
 * - maps a successful { advice } body
 * - 401 surfaces an AUTH_REQUIRED "sign in" error
 * - non-OK / unsuccessful bodies throw the server message
 */
import { toddyAdviceService, ToddyAdviceContext } from '../ToddyAdviceService';
import { config } from '../../../config';
import { supabase } from '../../supabase';

const getSessionMock = supabase.auth.getSession as jest.Mock;

const context: ToddyAdviceContext = {
  jobType: 'bathroom',
  notes: 'full refurb',
  lineItems: [{ description: 'Strip out', price: 800 }],
  quoteTotal: 5000,
};

function mockFetch(response: { ok?: boolean; status?: number; json: () => Promise<unknown> }) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: response.json,
    })
  ) as jest.Mock;
}

function lastCall(): [string, RequestInit] {
  const calls = (global.fetch as jest.Mock).mock.calls as Array<[string, RequestInit]>;
  return calls[calls.length - 1];
}

beforeEach(() => {
  jest.clearAllMocks();
  getSessionMock.mockResolvedValue({ data: { session: { access_token: 'user-jwt-123' } } });
});

describe('ToddyAdviceService.getAdvice', () => {
  it('sends the request to the toddy-advice endpoint with the user token', async () => {
    mockFetch({
      json: () =>
        Promise.resolve({
          success: true,
          advice: { winRange: { min: 1, max: 2 }, rationale: 'r', tips: ['t'] },
        }),
    });

    await toddyAdviceService.getAdvice(context);

    const [url, opts] = lastCall();
    expect(url).toContain('/functions/v1/toddy-advice');
    expect(opts.method).toBe('POST');
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer user-jwt-123');
    expect((opts.headers as Record<string, string>).apikey).toBe(config.supabase.anonKey);
    expect(JSON.parse(opts.body as string)).toMatchObject({
      jobType: 'bathroom',
      quoteTotal: 5000,
    });
  });

  it('returns the advice payload on success', async () => {
    const advice = { winRange: { min: 12000, max: 14500 }, rationale: 'r', tips: ['a', 'b'] };
    mockFetch({ json: () => Promise.resolve({ success: true, advice }) });

    await expect(toddyAdviceService.getAdvice(context)).resolves.toEqual(advice);
  });

  it('falls back to the anon key when there is no session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    mockFetch({
      json: () =>
        Promise.resolve({
          success: true,
          advice: { winRange: { min: 1, max: 2 }, rationale: '', tips: ['t'] },
        }),
    });

    await toddyAdviceService.getAdvice(context);

    const [, opts] = lastCall();
    expect((opts.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${config.supabase.anonKey}`
    );
  });

  it('throws an AUTH_REQUIRED error on 401', async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Please sign in to get advice.' } }),
    });

    await expect(toddyAdviceService.getAdvice(context)).rejects.toMatchObject({
      message: 'Please sign in to get advice.',
      code: 'AUTH_REQUIRED',
    });
  });

  it('throws the server message on an unsuccessful body', async () => {
    mockFetch({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ success: false, error: { message: "Toddy couldn't help." } }),
    });

    await expect(toddyAdviceService.getAdvice(context)).rejects.toThrow("Toddy couldn't help.");
  });
});
