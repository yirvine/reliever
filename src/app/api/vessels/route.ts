/**
 * Vessels API Route
 * 
 * POST - Save/update a vessel
 * GET - Get all vessels for logged-in user
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { getSupabaseAdmin } from '@/lib/supabase/database'

// Force this route to be dynamic (prevents build-time execution)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let vesselTag: string | undefined
  
  try {
    const { idToken, vessel } = await request.json()
    vesselTag = vessel.vesselTag // Store for error handling

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing Firebase ID token' },
        { status: 401 }
      )
    }

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

    // Upsert vessel (update if id exists, create if not)
    const vesselData = {
      user_id: user.id,
      vessel_tag: vessel.vesselTag || 'Untitled',
      vessel_name: vessel.vesselName || null,
      vessel_orientation: vessel.vesselOrientation || 'vertical',
      vessel_diameter: vessel.vesselDiameter || 0,
      straight_side_height: vessel.straightSideHeight || 0,
      head_type: vessel.headType || 'Hemispherical',
      vessel_design_mawp: vessel.vesselDesignMawp || 0,
      asme_set_pressure: vessel.asmeSetPressure || 0,
      updated_at: new Date().toISOString(),
    }

    let result
    if (vessel.id) {
      // Update existing vessel
      const { data, error } = await supabase
        .from('vessels')
        .update(vesselData)
        .eq('id', vessel.id)
        .eq('user_id', user.id) // Security: only update own vessels
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new vessel
      const { data, error } = await supabase
        .from('vessels')
        .insert(vesselData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      vessel: result,
    })
  } catch (error) {
    console.error('Error saving vessel:', error)
    
    // Handle duplicate vessel tag error (unique constraint on user_id + vessel_tag)
    // Note: Different users CAN have the same vessel tag - the constraint is only per user
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505' && 'message' in error && typeof error.message === 'string' && error.message.includes('vessels_user_id_vessel_tag_key')) {
      return NextResponse.json(
        { error: `You already have a vessel with tag "${vesselTag || 'this name'}". Please use a different vessel tag.` },
        { status: 409 } // 409 Conflict
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to save vessel' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get all vessels for this user
    const { data: vessels, error } = await supabase
      .from('vessels')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      vessels: vessels || [],
    })
  } catch (error) {
    console.error('Error fetching vessels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vessels' },
      { status: 500 }
    )
  }
}

