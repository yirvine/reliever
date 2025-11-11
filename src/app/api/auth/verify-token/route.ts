/**
 * Firebase Token Verification API Route
 * 
 * This route:
 * 1. Receives a Firebase ID token from the client
 * 2. Verifies it using Firebase Admin SDK
 * 3. Upserts the user record in Supabase
 * 4. Returns the Supabase user ID
 * 
 * Called by the AuthContext after successful Firebase sign-in.
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { getSupabaseAdmin } from '@/lib/supabase/database'

export async function POST(request: NextRequest) {
  try {
    // Handle empty or malformed request body
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing Firebase ID token' },
        { status: 400 }
      )
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const { uid: firebaseUid, email, name, email_verified } = decodedToken

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Invalid token: missing uid' },
        { status: 401 }
      )
    }

    // Get user record from Firebase Admin to check email verification status
    // (decodedToken doesn't always have email_verified, so we fetch the full user)
    let firebaseUser
    try {
      firebaseUser = await adminAuth.getUser(firebaseUid)
    } catch (error) {
      console.error('Failed to get Firebase user:', error)
      // Fallback to decodedToken values
      firebaseUser = { emailVerified: email_verified || false }
    }

    // Upsert user in Supabase
    const supabase = getSupabaseAdmin()
    
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          firebase_uid: firebaseUid,
          email: email || null,
          name: name || email?.split('@')[0] || null,
          email_verified: firebaseUser.emailVerified || false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'firebase_uid',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json(
        { error: 'Failed to create/update user in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firebaseUid: user.firebase_uid,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
      },
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 401 }
    )
  }
}

