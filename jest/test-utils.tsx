/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { AuthContext } from '../src/contexts/AuthContext';

// ─── Fixtures ────────────────────────────────────────────────────

export const mockAnonymousUser = {
  id: 'anon_test_123',
  tier: 'anonymous' as const,
  quotesUsed: 0,
  quotesLimit: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  anonymousId: 'anon_test_123',
};

export const mockFreeUser = {
  id: 'user_test_456',
  email: 'test@example.com',
  tier: 'free' as const,
  quotesUsed: 2,
  quotesLimit: 5,
  createdAt: '2025-01-01T00:00:00.000Z',
};

export const mockPremiumUser = {
  id: 'user_test_789',
  email: 'premium@example.com',
  tier: 'premium' as const,
  quotesUsed: 50,
  quotesLimit: 999999,
  createdAt: '2025-01-01T00:00:00.000Z',
  subscriptionStatus: 'active' as const,
};

// ─── Mock AuthContext value ──────────────────────────────────────

export function createMockAuthContext(overrides: Partial<any> = {}) {
  return {
    user: null,
    freemiumUser: mockAnonymousUser,
    session: null,
    loading: false,
    signIn: jest.fn(() => Promise.resolve({ error: null })),
    signUp: jest.fn(() => Promise.resolve({ error: null })),
    signUpTest: jest.fn(() => Promise.resolve({ error: null })),
    signOut: jest.fn(() => Promise.resolve()),
    isAuthenticated: false,
    isAnonymous: true,
    isPremium: false,
    canGenerateQuote: jest.fn(() => false),
    incrementQuoteUsage: jest.fn(() => Promise.resolve()),
    upgradeUser: jest.fn(() => Promise.resolve()),
    refreshPremiumStatus: jest.fn(() => Promise.resolve()),
    ...overrides,
  };
}

// ─── renderWithProviders ─────────────────────────────────────────

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: Partial<any>;
}

export function renderWithProviders(ui: React.ReactElement, options: ExtendedRenderOptions = {}) {
  const { authContext, ...renderOptions } = options;
  const mockAuth = createMockAuthContext(authContext);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockAuth,
  };
}

// Re-export everything from RTL
export * from '@testing-library/react-native';
// Override render with our custom version
export { renderWithProviders as render };
