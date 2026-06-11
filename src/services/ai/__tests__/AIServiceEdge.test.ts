/**
 * Tests for AIServiceEdge auth wiring (T1):
 * - the generation POST sends the logged-in user's access token
 * - falls back to the anon key when there is no session
 * - a 401 surfaces a clear "sign in" message
 */
import { AIService } from '../AIServiceEdge';
import { config } from '../../../config';
import { supabase } from '../../supabase';

const getSessionMock = supabase.auth.getSession as jest.Mock;

/** Find the POST call to the edge function among all fetch invocations. */
function lastPostCall(): [string, RequestInit] {
  const calls = (global.fetch as jest.Mock).mock.calls as Array<[string, RequestInit]>;
  const post = [...calls].reverse().find(([, opts]) => opts?.method === 'POST');
  if (!post) throw new Error('No POST request was made');
  return post;
}

function mockFetch(postResponse: Partial<Response> & { json?: () => Promise<unknown> }) {
  global.fetch = jest.fn((_url: string, opts?: RequestInit) => {
    if (opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        ...postResponse,
      });
    }
    // GET health check / prewarm
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok' }),
    });
  }) as jest.Mock;
}

const successBody = {
  success: true,
  data: { projectType: 'kitchen', confidence: 80, responseType: 'analysis' },
  aiProvider: 'gemini-structured',
};

describe('AIServiceEdge auth wiring', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it('sends the user access token as the bearer when a session exists', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: 'user-jwt-123' } },
      error: null,
    });
    mockFetch({ json: () => Promise.resolve(successBody) });

    await AIService.analyzeImage({ message: 'New kitchen, 12sqm' });

    const [, opts] = lastPostCall();
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer user-jwt-123');
    // apikey header stays the anon key for the Supabase gateway
    expect((opts.headers as Record<string, string>).apikey).toBe(config.supabase.anonKey);
  });

  it('falls back to the anon key when there is no session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    mockFetch({ json: () => Promise.resolve(successBody) });

    await AIService.analyzeImage({ message: 'New kitchen' });

    const [, opts] = lastPostCall();
    expect((opts.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${config.supabase.anonKey}`
    );
  });

  it('surfaces a clear sign-in message on 401', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Please sign in to generate a quote.' } }),
    });

    await expect(AIService.analyzeImage({ message: 'New kitchen' })).rejects.toThrow(
      /sign in to generate a quote/i
    );
  });

  it('surfaces an upgrade message and code on 429 (usage limit)', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: 'user-jwt-123' } },
      error: null,
    });
    mockFetch({
      ok: false,
      status: 429,
      json: () =>
        Promise.resolve({
          error: {
            code: 'USAGE_LIMIT_REACHED',
            message:
              "You've used all 5 free quotes this month. Upgrade to Pro for unlimited quotes.",
          },
        }),
    });

    await expect(AIService.analyzeImage({ message: 'New kitchen' })).rejects.toMatchObject({
      message: expect.stringMatching(/upgrade to pro/i),
      code: 'USAGE_LIMIT_REACHED',
    });
  });
});
