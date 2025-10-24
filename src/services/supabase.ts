import { createClient, AuthSession } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get environment variables directly from process.env for Expo
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Refresh session 60 seconds before expiry
    refreshThreshold: 60,
  },
});

// Authentication helper functions
export const authHelpers = {
  // Sign up new user
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Add user metadata for free tier
        data: {
          subscription_tier: 'free',
          created_via: 'mobile_app',
        },
        // Set redirect URL for mobile app
        emailRedirectTo: 'asktoddy://auth/callback',
      },
    });
    return { data, error };
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  // Test signup without email confirmation (for development)
  signUpTest: async (email: string, password: string) => {
    // Try to sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          subscription_tier: 'free',
          created_via: 'mobile_app',
          skip_confirmation: true,
        },
      },
    });

    if (error) {
      return { data, error };
    }

    // If user was created but not confirmed, try to sign them in anyway
    if (data.user && !data.session) {
      console.log('User created but not confirmed, attempting direct sign in...');
      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return signInResult;
    }

    return { data, error };
  },
};

// Database helper functions
export const dbHelpers = {
  // Upload image to storage
  uploadImage: async (uri: string, filename: string, bucket: string = 'project-images') => {
    try {
      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create unique filename with timestamp
      const fileExt = filename.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return {
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl: urlData.publicUrl,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Save analysis request
  saveAnalysisRequest: async (imageUrl: string, analysis: any, userId?: string) => {
    const { data, error } = await supabase
      .from('analysis_requests')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        analysis_result: analysis,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  // Get user's analysis history
  getUserAnalyses: async (userId: string, limit: number = 10) => {
    const { data, error } = await supabase
      .from('analysis_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },
};

export default supabase;
