/**
 * Vessel Cases API Route
 * 
 * POST - Save all cases for a vessel
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { getSupabaseAdmin } from '@/lib/supabase/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { idToken, cases } = await request.json()
    const { id: vesselId } = await params // Await params in Next.js 15

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

    // Verify user owns this vessel
    const { data: vessel } = await supabase
      .from('vessels')
      .select('id')
      .eq('id', vesselId)
      .eq('user_id', user.id)
      .single()

    if (!vessel) {
      return NextResponse.json(
        { error: 'Vessel not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare cases - save user inputs AND selection state
    interface CaseInput {
      caseType: string
      caseName?: string | null
      flowData?: Record<string, unknown>
      pressureData?: Record<string, unknown>
      isSelected?: boolean
      isCalculated?: boolean
      asmeVIIIDesignFlow?: number | null
      calculatedRelievingFlow?: number | null
    }
    const casesToSave = cases.map((c: CaseInput) => ({
      vessel_id: vesselId,
      user_id: user.id,
      case_type: c.caseType,
      case_name: c.caseName || null,
      // Store user inputs in JSONB columns
      flow_data: c.flowData || {},
      pressure_data: c.pressureData || {},
      // Store selection state and calculated results
      is_selected: c.isSelected || false,
      is_calculated: c.isCalculated || false,
      asme_viii_design_flow: c.asmeVIIIDesignFlow || null,
      calculated_relieving_flow: c.calculatedRelievingFlow || null,
      updated_at: new Date().toISOString(),
    }))

    // Delete existing cases for this vessel, then insert new ones
    await supabase
      .from('cases')
      .delete()
      .eq('vessel_id', vesselId)

    const { data: savedCases, error } = await supabase
      .from('cases')
      .insert(casesToSave)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      saved_count: savedCases?.length || 0,
    })
  } catch (error) {
    console.error('Error saving cases:', error)
    return NextResponse.json(
      { error: 'Failed to save cases' },
      { status: 500 }
    )
  }
}

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

    // Verify user owns this vessel
    const { data: vessel } = await supabase
      .from('vessels')
      .select('id')
      .eq('id', vesselId)
      .eq('user_id', user.id)
      .single()

    if (!vessel) {
      return NextResponse.json(
        { error: 'Vessel not found or access denied' },
        { status: 404 }
      )
    }

    // Get all cases for this vessel
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .eq('vessel_id', vesselId)
      .order('case_type', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      cases: cases || [],
    })
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    )
  }
}
