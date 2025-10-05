// Environment utility helpers

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Feature flags
export const ENABLE_MOCK_AUTH = isDevelopment;
export const ENABLE_SUPABASE_AUTH = true;

// Supabase environment variables
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Helper to determine which auth system to use
export const shouldUseMockAuth = () => {
  return ENABLE_MOCK_AUTH && !isSupabaseConfigured();
};

export const shouldUseRealAuth = () => {
  return ENABLE_SUPABASE_AUTH && isSupabaseConfigured();
};
