/**
 * Supabase Middleware
 * 
 * Handles session refresh for authenticated users.
 * Runs on every request to ensure valid sessions.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check for development webpack hot reload
  if (request.nextUrl.pathname.startsWith('/_next/webpack-hmr')) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // Wrapped in try-catch to handle hot reload edge cases
  try {
    await supabase.auth.getUser()
  } catch (error) {
    // Ignore auth errors during hot reload
    console.error('Auth refresh error (safe to ignore during dev):', error)
  }

  return supabaseResponse
}

