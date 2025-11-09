/**
 * Supabase Client (Browser)
 * 
 * Client-side Supabase instance for authentication and data operations.
 * Uses browser cookies for session management.
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

