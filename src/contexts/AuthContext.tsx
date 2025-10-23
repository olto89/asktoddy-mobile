import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Linking } from 'react-native';
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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session: initialSession } = await authHelpers.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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
          supabase.auth.setSession({ access_token, refresh_token }).then(() => {
            // If this is an email confirmation, navigate to success screen
            if (type === 'signup' || type === 'email_change') {
              console.log('Email verification successful, navigating to success screen');
              setTimeout(() => {
                navigate('VerificationSuccess');
              }, 1000); // Small delay to ensure navigation is ready
            }
          }).catch((error) => {
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

    return () => {
      subscription.unsubscribe();
      linkingSubscription?.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      setLoading(true);
      
      // Set a timeout to force loading to false after 30 seconds
      timeoutId = setTimeout(() => {
        console.warn('SignIn timeout reached, forcing loading to stop');
        setLoading(false);
      }, 30000);

      const { data, error } = await authHelpers.signIn(email, password);

      if (error) {
        return { error };
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
      await authHelpers.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
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
