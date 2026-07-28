import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Linking, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, authHelpers } from '../services/supabase';
import { navigate } from '../services/NavigationService';
import revenueCatService from '../services/RevenueCatService';
import { parseAuthDeepLink } from '../utils/parseAuthDeepLink';
import { quoteStorage } from '../services/QuoteStorageService';
import { logger } from '../services/Logger';

// Enhanced user types for freemium model
type UserTier = 'anonymous' | 'free' | 'premium';

interface FreemiumUser {
  id: string;
  email?: string;
  tier: UserTier;
  quotesUsed: number;
  quotesLimit: number;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  subscriptionId?: string;
  createdAt: string;
  anonymousId?: string; // For anonymous users
  companyName?: string;
  companyLogoUrl?: string;
  quoteValidityDays?: number;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  legalNotice?: string;
}

export interface BusinessProfileUpdates {
  companyName?: string;
  companyLogoUrl?: string | null;
  quoteValidityDays?: number;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  legalNotice?: string;
}

interface AuthContextType {
  user: User | null;
  freemiumUser: FreemiumUser;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isPremium: boolean;
  canGenerateQuote: () => boolean;
  incrementQuoteUsage: () => Promise<void>;
  upgradeUser: (tier: UserTier) => Promise<void>;
  refreshPremiumStatus: () => Promise<void>;
  updateCompanyProfile: (updates: BusinessProfileUpdates) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// Helper functions for anonymous user management
const generateAnonymousId = (): string => {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createAnonymousUser = (): FreemiumUser => ({
  id: generateAnonymousId(),
  tier: 'anonymous',
  quotesUsed: 0,
  quotesLimit: 0, // Anonymous users can't generate quotes
  createdAt: new Date().toISOString(),
  anonymousId: generateAnonymousId(),
});

const createFreeUser = (user: User): FreemiumUser => {
  const meta = user.user_metadata as any;
  return {
    id: user.id,
    email: user.email,
    tier: 'free',
    quotesUsed: 0,
    quotesLimit: 5, // Free tier limit
    createdAt: user.created_at || new Date().toISOString(),
    companyName: meta?.company_name,
    companyLogoUrl: meta?.company_logo_url,
    quoteValidityDays: meta?.quote_validity_days,
    businessAddress: meta?.business_address,
    businessPhone: meta?.business_phone,
    businessEmail: meta?.business_email,
    businessWebsite: meta?.business_website,
    legalNotice: meta?.legal_notice,
  };
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [freemiumUser, setFreemiumUser] = useState<FreemiumUser>(createAnonymousUser());
  const [loading, setLoading] = useState(true);

  // Use ref to track current session for intervals without causing re-renders
  const sessionRef = useRef<Session | null>(null);

  // Update ref whenever session changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    // Initialize auth state and set up listeners
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.debug('🔄 Initializing authentication...');

        // First, try to load existing freemium user data from storage
        const storedFreemiumUser = await loadFreemiumUserFromStorage();
        if (storedFreemiumUser) {
          setFreemiumUser(storedFreemiumUser);
          logger.debug('💾 Loaded existing freemium user:', storedFreemiumUser.tier);
        }

        // Get initial session. Guard it with a timeout: when the device is offline
        // (e.g. flight mode) supabase-js can block on a background token refresh held
        // behind its internal lock and never resolve, which would leave the whole app
        // stuck on the loading splash. Racing a timeout lets the UI come up in the
        // last-known/anonymous state; the real session resolves later via
        // onAuthStateChange once connectivity returns.
        const SESSION_TIMEOUT = Symbol('session-timeout');
        const raced = await Promise.race([
          supabase.auth.getSession(),
          new Promise<typeof SESSION_TIMEOUT>(resolve =>
            setTimeout(() => resolve(SESSION_TIMEOUT), 4000)
          ),
        ]);

        if (!mounted) return; // Component unmounted

        if (raced === SESSION_TIMEOUT) {
          logger.warn(
            '⏱️ getSession timed out (likely offline) — starting in last-known/anonymous state'
          );
          // Do NOT clear the stored session token here; connectivity may just be down.
          // Fall back to cached UI state so the app is usable offline.
          if (!storedFreemiumUser) {
            const anonymousUser = createAnonymousUser();
            setFreemiumUser(anonymousUser);
            await saveFreemiumUserToStorage(anonymousUser);
          }
        } else {
          const {
            data: { session },
            error,
          } = raced;

          if (error) {
            console.error('❌ Error getting initial session:', error);

            // If it's an invalid refresh token error, clear the session
            if (
              error.message?.includes('Invalid Refresh Token') ||
              error.message?.includes('Refresh Token Not Found')
            ) {
              logger.debug('🔄 Clearing invalid session...');
              await supabase.auth.signOut();
            }

            setSession(null);
            setUser(null);
            // Keep anonymous user if no session
            if (!storedFreemiumUser) {
              const anonymousUser = createAnonymousUser();
              setFreemiumUser(anonymousUser);
              await saveFreemiumUserToStorage(anonymousUser);
            }
          } else if (session) {
            logger.debug('✅ Initial session found for:', session.user?.email);
            setSession(session);
            setUser(session.user);
            // Convert to free user if not already upgraded
            const freeUser = createFreeUser(session.user);
            setFreemiumUser(freeUser);
            await saveFreemiumUserToStorage(freeUser);
          } else {
            logger.debug('ℹ️ No initial session found');
            setSession(null);
            setUser(null);
            // Keep anonymous user if no session
            if (!storedFreemiumUser) {
              const anonymousUser = createAnonymousUser();
              setFreemiumUser(anonymousUser);
              await saveFreemiumUserToStorage(anonymousUser);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          // Fallback to anonymous user
          const anonymousUser = createAnonymousUser();
          setFreemiumUser(anonymousUser);
          await saveFreemiumUserToStorage(anonymousUser);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('🔔 Auth state changed:', event, session?.user?.email);

      if (!mounted) return; // Component unmounted

      switch (event) {
        case 'INITIAL_SESSION':
          logger.debug('📱 Initial session loaded');
          // Don't override our initialization above
          return;
        case 'SIGNED_IN':
          logger.debug('✅ User signed in');
          setSession(session);
          setUser(session?.user ?? null);
          // Preserve anonymous session data when converting to free user
          if (session?.user) {
            // Get current anonymous session ID if exists
            const currentSessionId = freemiumUser.anonymousId;
            const currentQuotesUsed = freemiumUser.quotesUsed; // Preserve quotes used

            const freeUser = createFreeUser(session.user);
            // Preserve the anonymous session data
            freeUser.anonymousId = currentSessionId; // Keep the session ID for continuity
            freeUser.quotesUsed = currentQuotesUsed; // Preserve quota usage

            logger.debug('🆔 Creating free user with preserved session:', {
              tier: freeUser.tier,
              quotesUsed: freeUser.quotesUsed,
              quotesLimit: freeUser.quotesLimit,
              preservedSessionId: currentSessionId,
            });
            setFreemiumUser(freeUser);
            await saveFreemiumUserToStorage(freeUser);
            logger.debug('💾 Free user saved to storage with preserved session data');

            // Set RevenueCat user ID and sync premium status
            await revenueCatService.setUserId(session.user.id);
            // Check if user has active subscription (will upgrade if needed)
            const status = await revenueCatService.checkPremiumStatus();
            if (status.isPremium) {
              logger.debug('💎 User has active premium subscription');
              freeUser.tier = 'premium';
              freeUser.quotesLimit = 999999;
              freeUser.subscriptionStatus = 'active';
              setFreemiumUser(freeUser);
              await saveFreemiumUserToStorage(freeUser);
            }

            // Migrate any anonymous quotes to the new account
            const getToken = async () => session?.access_token ?? null;
            quoteStorage.migrateAnonymousQuotes(session.user.id, getToken).catch(err => {
              logger.warn('Quote migration after sign-in failed:', err);
            });
          }
          setLoading(false);
          break;
        case 'SIGNED_OUT':
          logger.debug('👋 User signed out');
          setSession(null);
          setUser(null);
          // Revert to anonymous user on sign out
          const anonymousUser = createAnonymousUser();
          setFreemiumUser(anonymousUser);
          await saveFreemiumUserToStorage(anonymousUser);
          setLoading(false);
          break;
        case 'TOKEN_REFRESHED':
          logger.debug('🔄 Token refreshed successfully');
          if (session) {
            setSession(session);
            setUser(session.user);
          }
          break;
        case 'USER_UPDATED':
          logger.debug('👤 User data updated');
          if (session) {
            setSession(session);
            setUser(session.user);
            // Update freemium user data
            const updatedFreeUser = createFreeUser(session.user);
            setFreemiumUser(updatedFreeUser);
            await saveFreemiumUserToStorage(updatedFreeUser);
          }
          break;
        default:
          logger.debug('🔔 Other auth event:', event);
          setSession(session);
          setUser(session?.user ?? null);
      }
    });

    // Handle deep links for email confirmation
    const handleDeepLink = (url: string) => {
      logger.debug('Deep link received:', url);
      if (url.includes('auth/callback')) {
        // Parse tokens from URL (handles both hash fragments and query params)
        const tokens = parseAuthDeepLink(url);

        if (tokens) {
          logger.debug('Setting session from deep link tokens');

          // Set the session - this triggers SIGNED_IN event which updates auth state
          supabase.auth
            .setSession({ access_token: tokens.access_token, refresh_token: tokens.refresh_token })
            .then(() => {
              if (tokens.type === 'recovery') {
                logger.debug('Password recovery deep link — navigating to ResetPassword');
                setTimeout(() => {
                  navigate('ResetPassword');
                }, 1000);
              } else if (tokens.type === 'signup' || tokens.type === 'email_change') {
                logger.debug('Email verification successful, user is now logged in');
                // Navigate to main app - session is already set, user is authenticated
                setTimeout(() => {
                  navigate('Main');
                }, 1000); // Small delay to ensure navigation is ready
              }
            })
            .catch(error => {
              console.error('Error setting session from deep link:', error);
            });
        } else {
          logger.debug('Invalid or missing tokens in deep link');
        }
      }
    };

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle app state changes (background/foreground) - simplified
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      logger.debug('📱 App state changed to:', nextAppState);

      if (nextAppState === 'active' && sessionRef.current && mounted) {
        // App came to foreground, do a gentle session check
        logger.debug('🔄 App activated, gentle session check...');
        try {
          const {
            data: { session: currentSession },
            error,
          } = await supabase.auth.getSession();

          if (!mounted) return; // Component unmounted

          if (error || !currentSession) {
            logger.warn('⚠️ Session invalid after app resume');
            setSession(null);
            setUser(null);
          } else if (currentSession.expires_at) {
            // Only refresh if close to expiry (within 5 minutes)
            const expiryTime = new Date(currentSession.expires_at * 1000);
            const minutesUntilExpiry = (expiryTime.getTime() - Date.now()) / (1000 * 60);

            if (minutesUntilExpiry < 5) {
              logger.debug('🔄 Refreshing session on app resume');
              try {
                const {
                  data: { session: refreshedSession },
                } = await supabase.auth.refreshSession();
                if (mounted && refreshedSession) {
                  logger.debug('✅ Session refreshed after app resume');
                  setSession(refreshedSession);
                  setUser(refreshedSession.user);
                }
              } catch (refreshError) {
                logger.warn('⚠️ Session refresh failed on app resume:', refreshError);
              }
            }
          }
        } catch (checkError) {
          logger.warn('⚠️ App resume session check error:', checkError);
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic session check (every 10 minutes - less aggressive)
    const sessionCheckInterval = setInterval(
      async () => {
        const currentSession = sessionRef.current;
        if (currentSession && mounted) {
          logger.debug('⏰ Periodic session check...');
          try {
            const {
              data: { session: freshSession },
              error,
            } = await supabase.auth.getSession();

            if (!mounted) return; // Component unmounted

            if (error || !freshSession) {
              logger.warn('⚠️ Session check failed, might be expired');

              // If it's an invalid refresh token error, clear the session
              if (
                error?.message?.includes('Invalid Refresh Token') ||
                error?.message?.includes('Refresh Token Not Found')
              ) {
                logger.debug('🔄 Clearing invalid session during periodic check...');
                await supabase.auth.signOut();
              }

              // Session is invalid, clear it
              setSession(null);
              setUser(null);
            } else {
              // Check if token needs refresh (within 10 minutes of expiry)
              const expiresAt = freshSession.expires_at;
              if (expiresAt) {
                const expiryTime = new Date(expiresAt * 1000);
                const now = new Date();
                const minutesUntilExpiry = (expiryTime.getTime() - now.getTime()) / (1000 * 60);

                logger.debug(`⏱️ Token expires in ${minutesUntilExpiry.toFixed(1)} minutes`);

                if (minutesUntilExpiry < 10) {
                  logger.debug('🔄 Token expiring soon, refreshing...');
                  try {
                    const {
                      data: { session: refreshedSession },
                    } = await supabase.auth.refreshSession();

                    if (mounted && refreshedSession) {
                      logger.debug('✅ Token refreshed proactively');
                      setSession(refreshedSession);
                      setUser(refreshedSession.user ?? null);
                    }
                  } catch (refreshError) {
                    logger.warn('⚠️ Token refresh failed:', refreshError);
                  }
                }
              }
            }
          } catch (checkError) {
            logger.warn('⚠️ Session check error:', checkError);
          }
        }
      },
      10 * 60 * 1000
    ); // Check every 10 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      linkingSubscription?.remove();
      appStateSubscription?.remove();
      clearInterval(sessionCheckInterval);
    };
  }, []); // Remove session dependency to prevent re-running

  const signIn = async (email: string, password: string) => {
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      logger.debug('🔐 Attempting sign in for:', email);
      logger.debug('🔐 Current session before sign in:', session?.user?.email || 'none');

      // Store current anonymous session data before sign in
      const currentAnonymousId = freemiumUser.anonymousId;
      const currentQuotesUsed = freemiumUser.quotesUsed;

      // Set a timeout to prevent hanging (but don't set global loading)
      timeoutId = setTimeout(() => {
        logger.warn('SignIn timeout reached');
      }, 30000);

      const { data, error } = await authHelpers.signIn(email, password);

      logger.debug('🔐 SignIn response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        hasError: !!error,
        errorMessage: error?.message,
      });

      if (error) {
        console.error('❌ Sign in error:', error.message);
        console.error('❌ Full error object:', error);
        return { error };
      }

      if (data?.user && data?.session) {
        logger.debug('✅ Sign in successful for:', data.user.email);
        logger.debug(
          '✅ Session obtained:',
          data.session.access_token ? 'token present' : 'no token'
        );

        // Immediately update freemium user to preserve session continuity
        const freeUser = createFreeUser(data.user);
        freeUser.anonymousId = currentAnonymousId;
        freeUser.quotesUsed = currentQuotesUsed;
        setFreemiumUser(freeUser);
        await saveFreemiumUserToStorage(freeUser);

        // The auth state change listener will handle setting the session
        return { error: null };
      }

      if (data?.user && !data?.session) {
        logger.warn('⚠️ User returned but no session - might need email verification');
        return {
          error: {
            message: 'Please check your email to verify your account',
            code: 'EMAIL_NOT_CONFIRMED',
          },
        };
      }

      // Handle case where no error but also no user data
      logger.warn('⚠️ Sign in completed but no user data received');
      logger.warn('⚠️ Full response:', data);
      return {
        error: {
          message: 'Login failed - please try again',
          code: 'NO_USER_DATA',
        },
      };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error };
    } finally {
      // Clear timeout (no global loading to reset)
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Set a timeout to prevent hanging (but don't set global loading)
      timeoutId = setTimeout(() => {
        logger.warn('SignUp timeout reached');
      }, 30000);

      const { data, error } = await authHelpers.signUp(email, password);

      if (error) {
        return { error };
      }

      // Check if user needs email verification
      if (data.user && !data.session) {
        // User created but needs email confirmation
        return {
          error: null,
          needsVerification: true,
        };
      }

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      // Clear timeout (no global loading to reset)
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      logger.debug('🔄 Signing out user...');

      // Clear RevenueCat user ID
      await revenueCatService.clearUserId();

      // Sign out from Supabase (this also clears AsyncStorage)
      const { error } = await authHelpers.signOut();

      if (error) {
        console.error('❌ Error signing out:', error);
        // Even if there's an error, clear local state
      }

      // Clear local state
      setUser(null);
      setSession(null);

      // Clear all user data from AsyncStorage for privacy/security
      await quoteStorage.clear();
      await AsyncStorage.removeItem('freemium_user');

      // Revert to anonymous user
      const anonymousUser = createAnonymousUser();
      setFreemiumUser(anonymousUser);
      await saveFreemiumUserToStorage(anonymousUser);

      logger.debug('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      // Still clear local state on error
      setUser(null);
      setSession(null);

      // Clear all user data from AsyncStorage even on error
      try {
        await quoteStorage.clear();
        await AsyncStorage.removeItem('freemium_user');
      } catch (clearError) {
        console.error('❌ Error clearing AsyncStorage:', clearError);
      }

      // Still revert to anonymous
      const anonymousUser = createAnonymousUser();
      setFreemiumUser(anonymousUser);
      await saveFreemiumUserToStorage(anonymousUser);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      logger.debug('🗑️ Deleting user account...');

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) {
        throw error;
      }

      // Clean up RevenueCat and local quote storage
      await revenueCatService.clearUserId();
      await quoteStorage.clear();

      // Sign out properly through Supabase auth — this fires the SIGNED_OUT event
      // which the auth listener handles (clears session, reverts to anonymous user)
      await authHelpers.signOut();

      logger.debug('✅ Account deleted successfully');
    } finally {
      setLoading(false);
    }
  };

  // Freemium helper functions
  const loadFreemiumUserFromStorage = async (): Promise<FreemiumUser | null> => {
    try {
      const storedUser = await AsyncStorage.getItem('freemium_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error loading freemium user from storage:', error);
      return null;
    }
  };

  const saveFreemiumUserToStorage = async (freemiumUser: FreemiumUser) => {
    try {
      await AsyncStorage.setItem('freemium_user', JSON.stringify(freemiumUser));
    } catch (error) {
      console.error('Error saving freemium user to storage:', error);
    }
  };

  const canGenerateQuote = (): boolean => {
    // Anonymous users cannot generate quotes - must sign up
    if (freemiumUser.tier === 'anonymous') {
      return false;
    }

    // Free users have limits
    if (freemiumUser.tier === 'free') {
      return freemiumUser.quotesUsed < freemiumUser.quotesLimit;
    }

    // Premium users have unlimited quotes
    if (freemiumUser.tier === 'premium') {
      return true;
    }

    return false;
  };

  const incrementQuoteUsage = async (): Promise<void> => {
    if (freemiumUser.tier === 'free' && freemiumUser.quotesUsed < freemiumUser.quotesLimit) {
      const updatedUser = {
        ...freemiumUser,
        quotesUsed: freemiumUser.quotesUsed + 1,
      };
      setFreemiumUser(updatedUser);
      await saveFreemiumUserToStorage(updatedUser);
      logger.debug(
        `📊 Quote usage incremented: ${updatedUser.quotesUsed}/${updatedUser.quotesLimit}`
      );
    }
  };

  const upgradeUser = async (tier: UserTier): Promise<void> => {
    const upgradedUser = {
      ...freemiumUser,
      tier,
      quotesLimit: tier === 'premium' ? 999999 : 5, // Effectively unlimited for premium
      subscriptionStatus: tier === 'premium' ? ('active' as const) : undefined,
    };
    setFreemiumUser(upgradedUser);
    await saveFreemiumUserToStorage(upgradedUser);
    logger.debug(`🎉 User upgraded to ${tier}`);
  };

  // Sync premium status with RevenueCat
  const syncRevenueCatStatus = async (): Promise<void> => {
    try {
      const status = await revenueCatService.checkPremiumStatus();

      if (status.isPremium && freemiumUser.tier !== 'premium') {
        // User has premium subscription in RevenueCat
        logger.debug('💎 RevenueCat reports premium status, upgrading user');
        await upgradeUser('premium');
      } else if (!status.isPremium && freemiumUser.tier === 'premium') {
        // Premium expired or cancelled
        logger.debug('⚠️ Premium expired, downgrading to free');
        const downgraded = {
          ...freemiumUser,
          tier: 'free' as UserTier,
          quotesLimit: 5,
          subscriptionStatus: undefined,
        };
        setFreemiumUser(downgraded);
        await saveFreemiumUserToStorage(downgraded);
      }
    } catch (error) {
      logger.warn('Failed to sync RevenueCat status:', error);
    }
  };

  const updateCompanyProfile = async (updates: BusinessProfileUpdates): Promise<void> => {
    const metadata: Record<string, any> = {};
    const fieldMap: Record<keyof BusinessProfileUpdates, string> = {
      companyName: 'company_name',
      companyLogoUrl: 'company_logo_url',
      quoteValidityDays: 'quote_validity_days',
      businessAddress: 'business_address',
      businessPhone: 'business_phone',
      businessEmail: 'business_email',
      businessWebsite: 'business_website',
      legalNotice: 'legal_notice',
    };

    for (const [key, metaKey] of Object.entries(fieldMap)) {
      const value = updates[key as keyof BusinessProfileUpdates];
      if (value !== undefined) {
        metadata[metaKey] = value;
      }
    }

    const { error } = await supabase.auth.updateUser({ data: metadata });
    if (error) throw error;

    const updatedUser: FreemiumUser = {
      ...freemiumUser,
      ...Object.fromEntries(
        Object.entries(updates)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, v === null ? undefined : v])
      ),
    };
    setFreemiumUser(updatedUser);
    await saveFreemiumUserToStorage(updatedUser);
  };

  const value: AuthContextType = {
    user,
    freemiumUser,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    isAuthenticated: !!user,
    isAnonymous: freemiumUser.tier === 'anonymous',
    isPremium: freemiumUser.tier === 'premium',
    canGenerateQuote,
    incrementQuoteUsage,
    upgradeUser,
    refreshPremiumStatus: syncRevenueCatStatus,
    updateCompanyProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
