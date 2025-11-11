/**
 * Single Vessel API Route
 * 
 * GET - Fetch a specific vessel by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { getSupabaseAdmin } from '@/lib/supabase/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vesselId } = await params
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const idToken = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const firebaseUid = decodedToken.uid

    // Get Supabase user
    const supabase = getSupabaseAdmin()
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the vessel (verify ownership)
    const { data: vessel, error } = await supabase
      .from('vessels')
      .select('*')
      .eq('id', vesselId)
      .eq('user_id', user.id)
      .single()

    if (error || !vessel) {
      return NextResponse.json(
        { error: 'Vessel not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      vessel,
    })
  } catch (error) {
    console.error('Error fetching vessel:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vessel' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vesselId } = await params
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const idToken = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const firebaseUid = decodedToken.uid

    // Get Supabase user
    const supabase = getSupabaseAdmin()
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete the vessel (will cascade delete cases due to ON DELETE CASCADE)
    const { error } = await supabase
      .from('vessels')
      .delete()
      .eq('id', vesselId)
      .eq('user_id', user.id) // Security: only delete own vessels

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Vessel deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting vessel:', error)
    return NextResponse.json(
      { error: 'Failed to delete vessel' },
      { status: 500 }
    )
  }
}

