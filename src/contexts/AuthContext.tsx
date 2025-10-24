import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Linking, AppState, AppStateStatus } from 'react-native';
import { supabase, authHelpers } from '../services/supabase';
import { navigate } from '../services/NavigationService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any; needsVerification?: boolean }>;
  signUpTest: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from storage
    const getInitialSession = async () => {
      try {
        console.log('🔄 Checking for existing session...');

        // First try to get the stored session
        const { session: initialSession, error } = await authHelpers.getSession();

        if (error) {
          console.error('❌ Error getting session:', error);
        } else if (initialSession) {
          console.log('✅ Found existing session for:', initialSession.user?.email);
          setSession(initialSession);
          setUser(initialSession.user ?? null);

          // Refresh the session to ensure it's valid
          const {
            data: { session: refreshedSession },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.warn('⚠️ Session refresh failed:', refreshError);
            // Session might be expired, clear it
            if (
              refreshError.message?.includes('refresh_token_not_found') ||
              refreshError.message?.includes('invalid')
            ) {
              console.log('🔄 Session expired, clearing...');
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
            }
          } else if (refreshedSession) {
            console.log('✅ Session refreshed successfully');
            setSession(refreshedSession);
            setUser(refreshedSession.user ?? null);
          }
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error) {
        console.error('❌ Error during session initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email);

      switch (event) {
        case 'INITIAL_SESSION':
          // Initial session is loaded
          console.log('📱 Initial session loaded');
          break;
        case 'SIGNED_IN':
          console.log('✅ User signed in');
          break;
        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          break;
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed successfully');
          break;
        case 'USER_UPDATED':
          console.log('👤 User data updated');
          break;
      }

      setSession(session);
      setUser(session?.user ?? null);

      // Only set loading to false if it's not the initial load
      if (event !== 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    // Handle deep links for email confirmation
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      if (url.includes('auth/callback')) {
        // Extract tokens from URL and handle email confirmation
        const urlParams = new URL(url).searchParams;
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        if (access_token && refresh_token) {
          console.log('Setting session from deep link tokens');

          // Set the session first
          supabase.auth
            .setSession({ access_token, refresh_token })
            .then(() => {
              // If this is an email confirmation, navigate to success screen
              if (type === 'signup' || type === 'email_change') {
                console.log('Email verification successful, navigating to success screen');
                setTimeout(() => {
                  navigate('VerificationSuccess');
                }, 1000); // Small delay to ensure navigation is ready
              }
            })
            .catch(error => {
              console.error('Error setting session from deep link:', error);
            });
        } else {
          console.log('Invalid or missing tokens in deep link');
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

    // Handle app state changes (background/foreground)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed to:', nextAppState);

      if (nextAppState === 'active' && session) {
        // App came to foreground, check if session is still valid
        console.log('🔄 App activated, checking session...');
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error || !currentSession) {
          console.warn('⚠️ Session invalid after app resume');
          setSession(null);
          setUser(null);
        } else {
          // Try to refresh the session
          const {
            data: { session: refreshedSession },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (!refreshError && refreshedSession) {
            console.log('✅ Session refreshed after app resume');
            setSession(refreshedSession);
            setUser(refreshedSession.user ?? null);
          }
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(
      async () => {
        if (session) {
          console.log('⏰ Periodic session check...');
          const {
            data: { session: currentSession },
            error,
          } = await supabase.auth.getSession();

          if (error || !currentSession) {
            console.warn('⚠️ Session check failed, might be expired');
            // Session is invalid, clear it
            setSession(null);
            setUser(null);
          } else {
            // Check if token needs refresh (within 5 minutes of expiry)
            const expiresAt = currentSession.expires_at;
            if (expiresAt) {
              const expiryTime = new Date(expiresAt * 1000);
              const now = new Date();
              const minutesUntilExpiry = (expiryTime.getTime() - now.getTime()) / (1000 * 60);

              console.log(`⏱️ Token expires in ${minutesUntilExpiry.toFixed(1)} minutes`);

              if (minutesUntilExpiry < 5) {
                console.log('🔄 Token expiring soon, refreshing...');
                const {
                  data: { session: refreshedSession },
                } = await supabase.auth.refreshSession();
                if (refreshedSession) {
                  console.log('✅ Token refreshed proactively');
                  setSession(refreshedSession);
                  setUser(refreshedSession.user ?? null);
                }
              }
            }
          }
        }
      },
      5 * 60 * 1000
    ); // Check every 5 minutes

    return () => {
      subscription.unsubscribe();
      linkingSubscription?.remove();
      appStateSubscription?.remove();
      clearInterval(sessionCheckInterval);
    };
  }, [session]);

  const signIn = async (email: string, password: string) => {
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setLoading(true);
      console.log('🔐 Attempting sign in for:', email);

      // Set a timeout to force loading to false after 30 seconds
      timeoutId = setTimeout(() => {
        console.warn('SignIn timeout reached, forcing loading to stop');
        setLoading(false);
      }, 30000);

      const { data, error } = await authHelpers.signIn(email, password);

      if (error) {
        console.error('❌ Sign in error:', error.message);
        // Ensure we return the original error object with all properties
        return { error };
      }

      if (data?.user) {
        console.log('✅ Sign in successful for:', data.user.email);
        return { error: null };
      }

      // Handle case where no error but also no user data
      console.warn('⚠️ Sign in completed but no user data received');
      return {
        error: {
          message: 'Login failed - no user data received',
          code: 'NO_USER_DATA',
        },
      };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error };
    } finally {
      // Clear timeout and set loading to false
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setLoading(true);

      // Set a timeout to force loading to false after 30 seconds
      timeoutId = setTimeout(() => {
        console.warn('SignUp timeout reached, forcing loading to stop');
        setLoading(false);
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
      // Clear timeout and set loading to false
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  };

  const signUpTest = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await authHelpers.signUpTest(email, password);

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🔄 Signing out user...');

      // Sign out from Supabase (this also clears AsyncStorage)
      const { error } = await authHelpers.signOut();

      if (error) {
        console.error('❌ Error signing out:', error);
        // Even if there's an error, clear local state
      }

      // Clear local state
      setUser(null);
      setSession(null);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      // Still clear local state on error
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signUpTest,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
