/* eslint-disable @typescript-eslint/no-explicit-any, max-lines-per-function, max-lines */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthContext, AuthProvider, useAuth } from '../AuthContext';
import { supabase, authHelpers } from '../../services/supabase';
import revenueCatService from '../../services/RevenueCatService';
import { quoteStorage } from '../../services/QuoteStorageService';

// Mock QuoteStorageService
jest.mock('../../services/QuoteStorageService', () => ({
  quoteStorage: {
    clear: jest.fn(() => Promise.resolve()),
    migrateAnonymousQuotes: jest.fn(() => Promise.resolve()),
  },
}));

// Get mocked modules
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockAuthHelpers = authHelpers as jest.Mocked<typeof authHelpers>;
const mockRevenueCat = revenueCatService as jest.Mocked<typeof revenueCatService>;
const mockQuoteStorage = quoteStorage as jest.Mocked<typeof quoteStorage>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure supabase.functions.invoke is available for deleteAccount tests
    (mockSupabase as any).functions = {
      invoke: jest.fn(() => Promise.resolve({ data: { success: true }, error: null })),
    };
  });

  describe('useAuth hook', () => {
    it('throws when used outside AuthProvider', () => {
      // Suppress expected error output
      const spy = jest.spyOn(console, 'error').mockImplementation();
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used within an AuthProvider'
      );
      spy.mockRestore();
    });

    it('provides default anonymous state', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAnonymous).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isPremium).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.freemiumUser.tier).toBe('anonymous');
    });

    it('does not get stuck on the loading splash when getSession hangs (offline / flight mode)', async () => {
      // Simulate supabase-js blocking on a background token refresh that never
      // resolves while offline — previously this left the whole app on the splash.
      (mockSupabase.auth.getSession as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // never resolves (only for this test's init call)
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      // The internal timeout guard must still flip loading to false so the UI renders.
      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 6000 });

      // App is usable offline in a safe fallback state (no session, anonymous).
      expect(result.current.user).toBeNull();
      expect(result.current.isAnonymous).toBe(true);
    }, 10000);
  });

  describe('canGenerateQuote', () => {
    it('returns false for anonymous users', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canGenerateQuote()).toBe(false);
    });

    it('returns true for free user under quota', () => {
      const mockAuth = {
        user: null,
        freemiumUser: {
          id: 'test',
          tier: 'free' as const,
          quotesUsed: 2,
          quotesLimit: 5,
          createdAt: new Date().toISOString(),
        },
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: false,
        isAnonymous: false,
        isPremium: false,
        canGenerateQuote: () => true,
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
        deleteAccount: jest.fn(),
        updateCompanyProfile: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.canGenerateQuote()).toBe(true);
    });

    it('returns false for free user at quota limit', () => {
      const mockAuth = {
        user: null,
        freemiumUser: {
          id: 'test',
          tier: 'free' as const,
          quotesUsed: 5,
          quotesLimit: 5,
          createdAt: new Date().toISOString(),
        },
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: false,
        isAnonymous: false,
        isPremium: false,
        canGenerateQuote: () => false,
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
        deleteAccount: jest.fn(),
        updateCompanyProfile: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.canGenerateQuote()).toBe(false);
    });

    it('returns true for premium users', () => {
      const mockAuth = {
        user: null,
        freemiumUser: {
          id: 'test',
          tier: 'premium' as const,
          quotesUsed: 100,
          quotesLimit: 999999,
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'active' as const,
        },
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: false,
        isAnonymous: false,
        isPremium: true,
        canGenerateQuote: () => true,
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
        deleteAccount: jest.fn(),
        updateCompanyProfile: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.canGenerateQuote()).toBe(true);
    });
  });

  describe('signUp', () => {
    it('returns needsVerification when user created without session', async () => {
      (mockAuthHelpers.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'new-user' }, session: null },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123');
      });

      expect(signUpResult.error).toBeNull();
      expect(signUpResult.needsVerification).toBe(true);
    });

    it('does NOT change auth state when verification is needed', async () => {
      (mockAuthHelpers.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'new-user' }, session: null },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123');
      });

      // User should still be anonymous - not authenticated yet
      expect(result.current.isAnonymous).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.freemiumUser.tier).toBe('anonymous');
    });
  });

  describe('tier states', () => {
    it('anonymous user has correct flags', () => {
      const mockAuth = {
        user: null,
        freemiumUser: {
          id: 'anon',
          tier: 'anonymous' as const,
          quotesUsed: 0,
          quotesLimit: 0,
          createdAt: new Date().toISOString(),
        },
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: false,
        isAnonymous: true,
        isPremium: false,
        canGenerateQuote: jest.fn(() => false),
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
        deleteAccount: jest.fn(),
        updateCompanyProfile: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isAnonymous).toBe(true);
      expect(result.current.isPremium).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('premium user has correct flags', () => {
      const mockAuth = {
        user: { id: 'u1', email: 'p@test.com' } as any,
        freemiumUser: {
          id: 'u1',
          email: 'p@test.com',
          tier: 'premium' as const,
          quotesUsed: 10,
          quotesLimit: 999999,
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'active' as const,
        },
        session: {} as any,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: true,
        isAnonymous: false,
        isPremium: true,
        canGenerateQuote: jest.fn(() => true),
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
        deleteAccount: jest.fn(),
        updateCompanyProfile: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isAnonymous).toBe(false);
      expect(result.current.isPremium).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('deleteAccount', () => {
    const mockSession = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2025-01-01T00:00:00.000Z',
        user_metadata: {},
      },
    };

    function setupAuthenticatedProvider() {
      // Mock getSession to return an active session
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      return wrapper;
    }

    it('calls edge function with correct authorization header', async () => {
      const wrapper = setupAuthenticatedProvider();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteAccount();
      });

      expect((mockSupabase as any).functions.invoke).toHaveBeenCalledWith('delete-account', {
        headers: { Authorization: `Bearer ${mockSession.access_token}` },
      });
    });

    it('signs out via authHelpers after successful deletion', async () => {
      const wrapper = setupAuthenticatedProvider();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteAccount();
      });

      expect(mockAuthHelpers.signOut).toHaveBeenCalled();
    });

    it('clears RevenueCat user ID', async () => {
      const wrapper = setupAuthenticatedProvider();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteAccount();
      });

      expect(mockRevenueCat.clearUserId).toHaveBeenCalled();
    });

    it('clears local quote storage', async () => {
      const wrapper = setupAuthenticatedProvider();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteAccount();
      });

      expect(mockQuoteStorage.clear).toHaveBeenCalled();
    });

    it('throws when there is no active session', async () => {
      // Default mock returns no session
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.deleteAccount();
        })
      ).rejects.toThrow('No active session');
    });

    it('throws when edge function returns an error', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });
      (mockSupabase as any).functions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Server error'),
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.deleteAccount();
        })
      ).rejects.toThrow('Server error');

      // signOut should NOT have been called since the edge function failed
      expect(mockAuthHelpers.signOut).not.toHaveBeenCalled();
    });
  });
});
