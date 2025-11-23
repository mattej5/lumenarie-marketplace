import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '@/lib/utils/env';
import { Database } from './database.types';

export function createClient() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
    // Return a dummy client to prevent crashes
    return null;
  }

  return createBrowserClient<Database>(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!
  );
}

// Export a singleton instance
export const supabase = createClient();
