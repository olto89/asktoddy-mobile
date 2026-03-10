/* eslint-disable @typescript-eslint/no-explicit-any, max-lines-per-function, max-lines */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthContext, AuthProvider, useAuth } from '../AuthContext';
import { supabase, authHelpers } from '../../services/supabase';

// Get mocked modules
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockAuthHelpers = authHelpers as jest.Mocked<typeof authHelpers>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        signUpTest: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: false,
        isAnonymous: false,
        isPremium: false,
        canGenerateQuote: () => true,
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
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
        signUpTest: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: false,
        isAnonymous: false,
        isPremium: false,
        canGenerateQuote: () => false,
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
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
        signUpTest: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: false,
        isAnonymous: false,
        isPremium: true,
        canGenerateQuote: () => true,
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.canGenerateQuote()).toBe(true);
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
        signUpTest: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: false,
        isAnonymous: true,
        isPremium: false,
        canGenerateQuote: jest.fn(() => false),
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
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
        signUpTest: jest.fn(),
        signOut: jest.fn(),
        isAuthenticated: true,
        isAnonymous: false,
        isPremium: true,
        canGenerateQuote: jest.fn(() => true),
        incrementQuoteUsage: jest.fn(),
        upgradeUser: jest.fn(),
        refreshPremiumStatus: jest.fn(),
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
});
