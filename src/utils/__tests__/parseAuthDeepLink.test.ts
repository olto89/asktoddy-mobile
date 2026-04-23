import { parseAuthDeepLink } from '../parseAuthDeepLink';

describe('parseAuthDeepLink', () => {
  const mockAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
  const mockRefreshToken = 'refresh_token_abc123';

  it('parses tokens from hash fragments (Supabase default format)', () => {
    const url = `https://myapp.com/auth/callback#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&type=signup`;

    const result = parseAuthDeepLink(url);

    expect(result).toEqual({
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      type: 'signup',
    });
  });

  it('parses tokens from query parameters', () => {
    const url = `https://myapp.com/auth/callback?access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&type=email_change`;

    const result = parseAuthDeepLink(url);

    expect(result).toEqual({
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      type: 'email_change',
    });
  });

  it('prefers hash fragments over query parameters', () => {
    const url = `https://myapp.com/auth/callback?access_token=wrong&refresh_token=wrong#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&type=signup`;

    const result = parseAuthDeepLink(url);

    expect(result).toEqual({
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      type: 'signup',
    });
  });

  it('returns null when access_token is missing', () => {
    const url = `https://myapp.com/auth/callback#refresh_token=${mockRefreshToken}&type=signup`;

    expect(parseAuthDeepLink(url)).toBeNull();
  });

  it('returns null when refresh_token is missing', () => {
    const url = `https://myapp.com/auth/callback#access_token=${mockAccessToken}&type=signup`;

    expect(parseAuthDeepLink(url)).toBeNull();
  });

  it('returns null for non-auth URLs', () => {
    expect(parseAuthDeepLink('https://myapp.com/dashboard')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(parseAuthDeepLink('not-a-url')).toBeNull();
  });

  it('handles type being null when not provided', () => {
    const url = `https://myapp.com/auth/callback#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}`;

    const result = parseAuthDeepLink(url);

    expect(result).toEqual({
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      type: null,
    });
  });

  it('handles expo deep link scheme', () => {
    const url = `exp://192.168.1.1:8081/auth/callback#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&type=signup`;

    const result = parseAuthDeepLink(url);

    expect(result).toEqual({
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      type: 'signup',
    });
  });

  it('handles custom app scheme', () => {
    const url = `asktoddy://auth/callback#access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}&type=signup`;

    const result = parseAuthDeepLink(url);

    expect(result).toEqual({
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      type: 'signup',
    });
  });
});
