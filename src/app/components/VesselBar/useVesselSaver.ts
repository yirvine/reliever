/**
 * useVesselSaver Hook
 * 
 * Handles vessel saving logic (manual + auto-save):
 * - Save vessel data to database
 * - Save case data to database
 * - Cache management
 * - Optimistic updates to vessel list
 */

import { useState } from 'react'
import { auth } from '@/lib/firebase/config'
import { collectCaseDataFromLocalStorage } from './vesselHelpers'
import { type VesselData } from '../../context/VesselContext'

interface UseVesselSaverProps {
  currentVesselId: string | null
  setCurrentVesselId: (id: string | null) => void
  vesselData: VesselData
  fetchUserVessels: () => Promise<void>
  updateVesselInList: (vesselId: string, updates: { vessel_tag: string; vessel_name: string | null }) => void
  triggerVesselsUpdate: () => void
  onLoginRequired: () => void
}

export function useVesselSaver({
  currentVesselId,
  setCurrentVesselId,
  vesselData,
  fetchUserVessels,
  updateVesselInList,
  triggerVesselsUpdate,
  onLoginRequired
}: UseVesselSaverProps) {
  const [saving, setSaving] = useState(false)

  const handleSave = async (silent = false, vesselSnapshot?: VesselData, vesselIdSnapshot?: string) => {
    // Use auth.currentUser directly instead of context user to avoid stale closure
    if (!auth.currentUser) {
      if (!silent) onLoginRequired()
      return false
    }

    // Don't set saving state if silent (auto-save) to avoid UI flicker
    if (!silent) setSaving(true)
    
    try {
      const idToken = await auth.currentUser.getIdToken()
      if (!idToken) {
        if (!silent) throw new Error('No auth token')
        return false
      }

      // Use snapshots if provided (for auto-save), otherwise use current context data
      const dataToSave = vesselSnapshot || vesselData
      const idToSave = vesselIdSnapshot || currentVesselId

      // Save vessel
      const vesselResponse = await fetch('/api/vessels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          vessel: {
            id: idToSave,
            vesselTag: dataToSave.vesselTag,
            vesselName: dataToSave.vesselName,
            vesselOrientation: dataToSave.vesselOrientation,
            vesselDiameter: dataToSave.vesselDiameter,
            straightSideHeight: dataToSave.straightSideHeight,
            headType: dataToSave.headType,
            vesselDesignMawp: dataToSave.vesselDesignMawp,
            asmeSetPressure: dataToSave.asmeSetPressure,
          }
        })
      })

      if (!vesselResponse.ok) {
        const errorData = await vesselResponse.json()
        const error = new Error(errorData.error || 'Failed to save vessel')
        
        // In silent mode, log and return false instead of throwing
        if (silent) {
          return false
        }
        throw error
      }

      const savedVesselData = await vesselResponse.json()
      const vesselId = savedVesselData.vessel.id
      
      // Only update currentVesselId if not using snapshot (i.e., not auto-save)
      if (!vesselSnapshot) {
        setCurrentVesselId(vesselId)
      }

      // Save all cases
      const cases = collectCaseDataFromLocalStorage()
      const casesResponse = await fetch(`/api/vessels/${vesselId}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          cases
        })
      })

      if (!casesResponse.ok) {
        const errorData = await casesResponse.json()
        const error = new Error(errorData.error || 'Failed to save cases')
        
        // In silent mode, log and return false instead of throwing
        if (silent) {
          return false
        }
        throw error
      }

      // Cache the saved vessel and cases data for instant loading next time
      localStorage.setItem(`reliever-vessel-${vesselId}`, JSON.stringify(savedVesselData.vessel))
      const casesData = await casesResponse.json()
      if (casesData.cases) {
        localStorage.setItem(`reliever-vessel-cases-${vesselId}`, JSON.stringify(casesData.cases))
      }

      // Refresh vessels list only if not silent
      if (!silent) {
        await fetchUserVessels()
        triggerVesselsUpdate() // Notify Sidebar to refresh
      } else {
        // For auto-save (silent), optimistically update the vessel in the list
        updateVesselInList(vesselId, {
          vessel_tag: dataToSave.vesselTag,
          vessel_name: dataToSave.vesselName || null
        })
      }
      
      return true
    } catch (error) {
      console.error('Failed to save vessel (catch block):', error)
      if (!silent) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save vessel. Please try again.'
        alert(`❌ ${errorMessage}`)
      }
      return false
    } finally {
      if (!silent) setSaving(false)
    }
  }

  return { handleSave, saving }
}

