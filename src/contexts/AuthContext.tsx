import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
        console.log('🔄 Initializing authentication...');

        // Get initial session - let Supabase handle this naturally
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return; // Component unmounted

        if (error) {
          console.error('❌ Error getting initial session:', error);
          setSession(null);
          setUser(null);
        } else if (session) {
          console.log('✅ Initial session found for:', session.user?.email);
          setSession(session);
          setUser(session.user);
        } else {
          console.log('ℹ️ No initial session found');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
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
      console.log('🔔 Auth state changed:', event, session?.user?.email);

      if (!mounted) return; // Component unmounted

      switch (event) {
        case 'INITIAL_SESSION':
          console.log('📱 Initial session loaded');
          // Don't override our initialization above
          return;
        case 'SIGNED_IN':
          console.log('✅ User signed in');
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          break;
        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          setSession(null);
          setUser(null);
          setLoading(false);
          break;
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed successfully');
          if (session) {
            setSession(session);
            setUser(session.user);
          }
          break;
        case 'USER_UPDATED':
          console.log('👤 User data updated');
          if (session) {
            setSession(session);
            setUser(session.user);
          }
          break;
        default:
          console.log('🔔 Other auth event:', event);
          setSession(session);
          setUser(session?.user ?? null);
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

    // Handle app state changes (background/foreground) - simplified
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed to:', nextAppState);

      if (nextAppState === 'active' && sessionRef.current && mounted) {
        // App came to foreground, do a gentle session check
        console.log('🔄 App activated, gentle session check...');
        try {
          const {
            data: { session: currentSession },
            error,
          } = await supabase.auth.getSession();

          if (!mounted) return; // Component unmounted

          if (error || !currentSession) {
            console.warn('⚠️ Session invalid after app resume');
            setSession(null);
            setUser(null);
          } else if (currentSession.expires_at) {
            // Only refresh if close to expiry (within 5 minutes)
            const expiryTime = new Date(currentSession.expires_at * 1000);
            const minutesUntilExpiry = (expiryTime.getTime() - Date.now()) / (1000 * 60);

            if (minutesUntilExpiry < 5) {
              console.log('🔄 Refreshing session on app resume');
              try {
                const {
                  data: { session: refreshedSession },
                } = await supabase.auth.refreshSession();
                if (mounted && refreshedSession) {
                  console.log('✅ Session refreshed after app resume');
                  setSession(refreshedSession);
                  setUser(refreshedSession.user);
                }
              } catch (refreshError) {
                console.warn('⚠️ Session refresh failed on app resume:', refreshError);
              }
            }
          }
        } catch (checkError) {
          console.warn('⚠️ App resume session check error:', checkError);
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic session check (every 10 minutes - less aggressive)
    const sessionCheckInterval = setInterval(
      async () => {
        const currentSession = sessionRef.current;
        if (currentSession && mounted) {
          console.log('⏰ Periodic session check...');
          try {
            const {
              data: { session: freshSession },
              error,
            } = await supabase.auth.getSession();

            if (!mounted) return; // Component unmounted

            if (error || !freshSession) {
              console.warn('⚠️ Session check failed, might be expired');
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

                console.log(`⏱️ Token expires in ${minutesUntilExpiry.toFixed(1)} minutes`);

                if (minutesUntilExpiry < 10) {
                  console.log('🔄 Token expiring soon, refreshing...');
                  try {
                    const {
                      data: { session: refreshedSession },
                    } = await supabase.auth.refreshSession();

                    if (mounted && refreshedSession) {
                      console.log('✅ Token refreshed proactively');
                      setSession(refreshedSession);
                      setUser(refreshedSession.user ?? null);
                    }
                  } catch (refreshError) {
                    console.warn('⚠️ Token refresh failed:', refreshError);
                  }
                }
              }
            }
          } catch (checkError) {
            console.warn('⚠️ Session check error:', checkError);
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
      setLoading(true);
      console.log('🔐 Attempting sign in for:', email);
      console.log('🔐 Current session before sign in:', session?.user?.email || 'none');

      // Set a timeout to force loading to false after 30 seconds
      timeoutId = setTimeout(() => {
        console.warn('SignIn timeout reached, forcing loading to stop');
        setLoading(false);
      }, 30000);

      const { data, error } = await authHelpers.signIn(email, password);

      console.log('🔐 SignIn response:', {
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
        console.log('✅ Sign in successful for:', data.user.email);
        console.log(
          '✅ Session obtained:',
          data.session.access_token ? 'token present' : 'no token'
        );
        // The auth state change listener will handle setting the session
        return { error: null };
      }

      if (data?.user && !data?.session) {
        console.warn('⚠️ User returned but no session - might need email verification');
        return {
          error: {
            message: 'Please check your email to verify your account',
            code: 'EMAIL_NOT_CONFIRMED',
          },
        };
      }

      // Handle case where no error but also no user data
      console.warn('⚠️ Sign in completed but no user data received');
      console.warn('⚠️ Full response:', data);
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
