/**
 * Parse authentication tokens from a Supabase deep link URL.
 *
 * Supabase confirmation links may deliver tokens as either:
 *  - Hash fragments: ...#access_token=xxx&refresh_token=yyy&type=signup
 *  - Query parameters: ...?access_token=xxx&refresh_token=yyy&type=signup
 *
 * This helper handles both formats.
 */
export interface AuthDeepLinkTokens {
  access_token: string;
  refresh_token: string;
  type: string | null;
}

export function parseAuthDeepLink(url: string): AuthDeepLinkTokens | null {
  try {
    const parsed = new URL(url);

    // Try hash fragment first (Supabase implicit/PKCE flows)
    const hash = parsed.hash?.startsWith('#') ? parsed.hash.substring(1) : '';
    const hashParams = new URLSearchParams(hash);

    let access_token = hashParams.get('access_token');
    let refresh_token = hashParams.get('refresh_token');
    let type = hashParams.get('type');

    // Fall back to query parameters
    if (!access_token || !refresh_token) {
      access_token = parsed.searchParams.get('access_token');
      refresh_token = parsed.searchParams.get('refresh_token');
      type = parsed.searchParams.get('type');
    }

    if (access_token && refresh_token) {
      return { access_token, refresh_token, type };
    }

    return null;
  } catch {
    return null;
  }
}
