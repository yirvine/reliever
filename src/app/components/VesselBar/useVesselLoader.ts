/**
 * useVesselLoader Hook
 * 
 * Handles vessel loading and switching:
 * - Cache-first loading strategy
 * - Database fallback
 * - Concurrent switch guard
 * - Auto-save before switch
 * - Loading state management
 */

import { useState, useRef } from 'react'
import { auth } from '@/lib/firebase/config'
import { loadCasesFromData } from './vesselHelpers'
import { type CaseId, type CaseResult } from '../../context/CaseContext'
import { type VesselData } from '../../context/VesselContext'

interface UseVesselLoaderProps {
  currentVesselId: string | null
  setCurrentVesselId: (id: string | null) => void
  vesselData: VesselData
  updateVesselData: (field: keyof VesselData, value: string | number | boolean) => void
  applyCaseData: (selectedCases: Record<CaseId, boolean>, caseResults: Record<CaseId, CaseResult>) => void
  setLoadingVessel: (loading: boolean) => void
  setLoadingMessage: (message: string) => void
  handleSave: (silent?: boolean, vesselSnapshot?: VesselData, vesselIdSnapshot?: string) => Promise<boolean>
}

export function useVesselLoader({
  currentVesselId,
  setCurrentVesselId,
  vesselData,
  updateVesselData,
  applyCaseData,
  setLoadingVessel,
  setLoadingMessage,
  handleSave
}: UseVesselLoaderProps) {
  const [isSelectingVessel, setIsSelectingVessel] = useState(false)
  const lastHandledVesselIdRef = useRef<string | null>(null)

  const handleSelectVessel = async (vesselId: string) => {
    // Block only if user reselects the unsaved placeholder vessel
    if (vesselId === 'current' && !currentVesselId) {
      return
    }

    // Guard: Prevent concurrent vessel switches
    if (isSelectingVessel) {
      console.log('⚠️ Vessel switch already in progress, ignoring duplicate call')
      return
    }

    setIsSelectingVessel(true)
    let hasCache = false

    try {
      // Show loading modal IMMEDIATELY
      setLoadingMessage('Loading...')
      setLoadingVessel(true)

      // LET REACT RENDER THE MODAL FIRST
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // WAIT for auto-save to complete before switching vessels
      if (currentVesselId) {
        const vesselDataSnapshot = { ...vesselData }
        const currentVesselIdSnapshot = currentVesselId
        try {
          await handleSave(true, vesselDataSnapshot, currentVesselIdSnapshot)
          
          // Clear cache to force fresh DB load next time
          localStorage.removeItem(`reliever-vessel-${currentVesselIdSnapshot}`)
          localStorage.removeItem(`reliever-vessel-cases-${currentVesselIdSnapshot}`)
        } catch (error) {
          console.warn('Auto-save error:', error)
        }
      }
      
      // Try to load from cache first (optimistic UI)
      const cachedVesselData = localStorage.getItem(`reliever-vessel-${vesselId}`)
      const cachedCaseData = localStorage.getItem(`reliever-vessel-cases-${vesselId}`)
      
      if (cachedVesselData && cachedCaseData) {
        hasCache = true
        try {
          const vessel = JSON.parse(cachedVesselData)
          const cases = JSON.parse(cachedCaseData)
          
          // Load vessel data from cache
          updateVesselData('vesselTag', vessel.vessel_tag || '')
          updateVesselData('vesselName', vessel.vessel_name || '')
          updateVesselData('vesselOrientation', vessel.vessel_orientation || 'vertical')
          updateVesselData('vesselDiameter', vessel.vessel_diameter || 0)
          updateVesselData('straightSideHeight', vessel.straight_side_height || 0)
          updateVesselData('headType', vessel.head_type || 'Hemispherical')
          updateVesselData('vesselDesignMawp', vessel.vessel_design_mawp || 0)
          updateVesselData('asmeSetPressure', vessel.asme_set_pressure || 0)
          
          setCurrentVesselId(vesselId)
          
          // Load cases from cache
          loadCasesFromData(cases, applyCaseData)
          
          // Close modal immediately - cached data is now visible
          setLoadingVessel(false)
        } catch (error) {
          console.warn('Failed to parse cached data:', error)
          hasCache = false
        }
      }
      
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        if (!hasCache) setLoadingVessel(false)
        return
      }

      // Fetch fresh data from DB in background (to sync any changes with cache)
      const [vesselResponse, casesResponse] = await Promise.all([
        fetch(`/api/vessels/${vesselId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }),
        fetch(`/api/vessels/${vesselId}/cases`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        })
      ])

      if (!vesselResponse.ok) {
        const errorText = await vesselResponse.text()
        console.error('Failed to load vessel:', vesselResponse.status, errorText)
        throw new Error(`Failed to load vessel: ${vesselResponse.status}`)
      }

      const vesselDataResponse = await vesselResponse.json()
      const vessel = vesselDataResponse.vessel

      // Cache vessel data for future instant loading
      localStorage.setItem(`reliever-vessel-${vesselId}`, JSON.stringify(vessel))

      // Only update UI if we didn't use cache (to avoid double-render flicker)
      if (!hasCache) {
        // Load all vessel properties at once
        updateVesselData('vesselTag', vessel.vessel_tag || '')
        updateVesselData('vesselName', vessel.vessel_name || '')
        updateVesselData('vesselOrientation', vessel.vessel_orientation || 'vertical')
        updateVesselData('vesselDiameter', vessel.vessel_diameter || 0)
        updateVesselData('straightSideHeight', vessel.straight_side_height || 0)
        updateVesselData('headType', vessel.head_type || 'Hemispherical')
        updateVesselData('vesselDesignMawp', vessel.vessel_design_mawp || 0)
        updateVesselData('asmeSetPressure', vessel.asme_set_pressure || 0)
        setCurrentVesselId(vesselId)
      }

      // Load all cases into localStorage atomically
      if (casesResponse.ok) {
        const casesData = await casesResponse.json()
        const cases = casesData.cases || []

        // Cache case data for future instant loading
        localStorage.setItem(`reliever-vessel-cases-${vesselId}`, JSON.stringify(cases))
        
        // Only update if we didn't use cache
        if (!hasCache) {
          // Load case data via CaseContext (applyCaseData will update state + localStorage)
          loadCasesFromData(cases, applyCaseData)

          // Close loading modal (CaseContext handles the rest)
          setLoadingVessel(false)
        }
      } else if (!hasCache) {
        setLoadingVessel(false)
      }
    } catch (error) {
      console.error('Failed to load vessel:', error)
      if (!hasCache) {
        setLoadingVessel(false)
      }
    } finally {
      // Always clear the guard when done
      setIsSelectingVessel(false)
    }
  }

  return { 
    handleSelectVessel, 
    isSelectingVessel,
    lastHandledVesselIdRef 
  }
}

