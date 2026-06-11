export const config = {
  // AI Configuration
  // NB: the client does not switch AI providers — all AI runs in the
  // analyze-construction edge function, which falls back to UK pricing
  // templates server-side when Gemini is unavailable. There is no 'mock'
  // provider implemented, so it must not be listed here.
  ai: {
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    primaryProvider: 'gemini',
    enableFallback: true,
    fallbackProviders: [] as string[],
    timeoutMs: 30000,
  },

  // Supabase Configuration
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // Pricing Configuration
  pricing: {
    enableRealTimeUpdates: process.env.EXPO_PUBLIC_ENABLE_REAL_TIME_PRICING === 'true',
    cacheDurationMs: parseInt(process.env.EXPO_PUBLIC_PRICING_CACHE_DURATION_MS || '3600000'),
    fallbackToEstimates: true,
  },

  // App Configuration
  app: {
    env: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    isDevelopment: process.env.EXPO_PUBLIC_APP_ENV !== 'production',
    isProduction: process.env.EXPO_PUBLIC_APP_ENV === 'production',
  },
};
