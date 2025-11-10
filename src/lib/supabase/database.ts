/**
 * Supabase Database Client (Non-Auth)
 * 
 * This client is used for database operations only.
 * Authentication is handled by Firebase, not Supabase.
 * 
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (server-side only, has full database access)
 */

import { createClient } from '@supabase/supabase-js'

// Server-side client with service role key (bypasses RLS, use carefully)
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

