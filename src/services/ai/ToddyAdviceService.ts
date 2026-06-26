/**
 * Toddy Advice client — thin wrapper over the `toddy-advice` Edge Function.
 *
 * Lazy/on-demand: called only when the user taps "Get Toddy's advice" for a
 * generated quote. All advice logic lives server-side (see the edge function);
 * this just sends the quote context with the user's JWT and maps the response.
 */
import { config } from '../../config';
import { logger } from '../Logger';
import { supabase } from '../supabase';

export interface ToddyAdviceContext {
  jobType?: string;
  propertyType?: string;
  size?: string;
  notes?: string;
  lineItems: Array<{ description: string; price: number }>;
  quoteTotal: number;
}

export interface ToddyAdvice {
  winRange: { min: number; max: number };
  rationale: string;
  tips: string[];
}

const ADVICE_TIMEOUT_MS = 45_000;

class ToddyAdviceService {
  private baseUrl = `${config.supabase.url}/functions/v1/toddy-advice`;

  /** Logged-in user's access token, or anon key (which the edge fn rejects). */
  private async getAuthToken(): Promise<string> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? config.supabase.anonKey;
    } catch (error) {
      logger.warn('⚠️ Failed to read auth session for advice:', error);
      return config.supabase.anonKey;
    }
  }

  /**
   * Fetch Toddy's advice for a generated quote. Throws on failure with a
   * user-facing message; the caller surfaces a "try again" affordance. A 401
   * carries code AUTH_REQUIRED.
   */
  async getAdvice(context: ToddyAdviceContext): Promise<ToddyAdvice> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ADVICE_TIMEOUT_MS);

    try {
      const accessToken = await this.getAuthToken();
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(context),
        signal: controller.signal,
      });

      if (response.status === 401) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(body.error?.message || 'Please sign in to get advice.');
        (err as Error & { code?: string }).code = 'AUTH_REQUIRED';
        throw err;
      }

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success || !body?.advice) {
        throw new Error(body?.error?.message || "Couldn't load advice. Please try again.");
      }

      return body.advice as ToddyAdvice;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Advice timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const toddyAdviceService = new ToddyAdviceService();
export default ToddyAdviceService;
