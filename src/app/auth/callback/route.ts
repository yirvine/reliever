/**
 * Auth Callback Route
 * 
 * Handles OAuth redirects from Google sign-in.
 * Exchanges the auth code for a session and redirects to home.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to home page
  return NextResponse.redirect(`${origin}/`)
}

