/**
 * Intelligent fetch utility with smart retry logic for third-party APIs
 * Consistent error handling across all API integrations
 */

const IS_DEBUG = Deno.env.get('DEBUG') === 'true' || Deno.env.get('APP_ENV') === 'development';
const debug = (...args: unknown[]) => {
  if (IS_DEBUG) console.log(...args);
};

export interface IntelligentFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  retries?: number; // Default: 1
  retryDelay?: number; // Default: 1000ms
}

export interface FetchError extends Error {
  status?: number;
  response?: Response;
}

/**
 * Smart fetch with error-type-based retry logic
 * Preserves API quotas while handling transient failures
 */
export async function intelligentFetch(
  url: string,
  options: IntelligentFetchOptions = {}
): Promise<Response> {
  const { method = 'GET', headers = {}, body, retries = 1, retryDelay = 1000 } = options;

  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      if (response.ok) {
        return response;
      }

      // Smart error handling based on status code
      if (response.status === 429) {
        // Rate limit - DO NOT RETRY to preserve quota
        console.error('🚫 Rate limited - not retrying to preserve quota');
        const error: FetchError = new Error(`API quota exceeded: ${response.status}`);
        error.status = response.status;
        error.response = response;
        throw error;
      } else if (response.status === 401 || response.status === 403) {
        // Auth errors - DO NOT RETRY (won't help)
        console.error('🔐 Authentication error - not retrying');
        const error: FetchError = new Error(`API auth error: ${response.status}`);
        error.status = response.status;
        error.response = response;
        throw error;
      } else if (response.status >= 500 && response.status < 600) {
        // Server errors - RETRY ONCE (might be temporary)
        if (attempt < retries) {
          debug(`⚠️ Server error ${response.status}, retrying once...`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      } else if (response.status === 400) {
        // Bad request - DO NOT RETRY (won't help)
        console.error('❌ Bad request - not retrying');
        const error: FetchError = new Error(`API bad request: ${response.status}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      // Unknown error - don't retry
      console.error(`API error: ${response.status} ${response.statusText}`);
      const error: FetchError = new Error(`API error: ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    } catch (error) {
      // Network errors - RETRY ONCE
      if (
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection')
      ) {
        if (attempt < retries) {
          debug('🌐 Network error, retrying once...');
          attempt++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error('Failed to get API response after intelligent retries');
}

/**
 * Convenience wrapper for JSON APIs with intelligent retry logic
 */
export async function intelligentFetchJson<T = any>(
  url: string,
  options: IntelligentFetchOptions = {}
): Promise<T> {
  const response = await intelligentFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return await response.json();
}

/**
 * Error type classification for logging and monitoring
 */
export function classifyError(error: FetchError): string {
  if (error.status === 429) return 'quota_exceeded';
  if (error.status === 401 || error.status === 403) return 'auth_error';
  if (error.status === 400) return 'bad_request';
  if (error.status && error.status >= 500) return 'server_error';
  if (error.message?.includes('network')) return 'network_error';
  return 'unknown_error';
}
