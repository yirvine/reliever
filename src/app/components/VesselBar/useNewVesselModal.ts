/**
 * useNewVesselModal Hook
 * 
 * Handles new vessel creation flow:
 * - Modal state management
 * - Vessel name input
 * - Unique tag generation
 * - Vessel creation API call
 * - Post-creation vessel loading
 */

import { useState } from 'react'
import { auth } from '@/lib/firebase/config'
import { generateUniqueUntitledTag } from './vesselHelpers'
import { type SavedVessel } from '../../context/VesselContext'

interface UseNewVesselModalProps {
  userVessels: SavedVessel[]
  fetchUserVessels: () => Promise<void>
  setLoadingVessel: (loading: boolean) => void
  setLoadingMessage: (message: string) => void
  handleSelectVessel: (vesselId: string) => Promise<void>
}

export function useNewVesselModal({
  userVessels,
  fetchUserVessels,
  setLoadingVessel,
  setLoadingMessage,
  handleSelectVessel
}: UseNewVesselModalProps) {
  const [showNewVesselModal, setShowNewVesselModal] = useState(false)
  const [newVesselName, setNewVesselName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreateNewVessel = async () => {
    if (!newVesselName.trim()) {
      return
    }

    // Close modal and show loading overlay
    setShowNewVesselModal(false)
    setLoadingMessage('Creating vessel...')
    setLoadingVessel(true)
    setSaving(true)

    try {
      // Save the new vessel to the database
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        throw new Error('Not authenticated')
      }

      // Generate a unique default tag in the format "untitled-NN"
      // This prevents database constraint violations and ensures uniqueness
      const defaultTag = generateUniqueUntitledTag(userVessels)
      
      const vesselResponse = await fetch('/api/vessels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          vessel: {
            id: null, // New vessel
            vesselTag: defaultTag, // Auto-generated unique tag (e.g., "untitled-1")
            vesselName: newVesselName || 'Untitled Vessel', // Default name if empty
            vesselOrientation: '',
            vesselDiameter: 0,
            straightSideHeight: 0,
            headType: '',
            vesselDesignMawp: 0,
            asmeSetPressure: 0,
          }
        })
      })

      if (!vesselResponse.ok) {
        const errorData = await vesselResponse.json()
        throw new Error(errorData.error || 'Failed to create vessel')
      }

      const savedVesselData = await vesselResponse.json()
      const vesselId = savedVesselData.vessel.id
      
      // Refresh vessel list (single source of truth - no need for triggerVesselsUpdate)
      await fetchUserVessels()
      
      // Reset modal state
      setNewVesselName('')
      
      // Load the newly created vessel properly (this will fetch from DB, populate cache, and show all 7 case rows)
      // This ensures consistent state and avoids manual state manipulation
      await handleSelectVessel(vesselId)
      
    } catch (error) {
      console.error('Failed to create vessel:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vessel. Please try again.'
      alert(`❌ ${errorMessage}`)
      setLoadingVessel(false)
    } finally {
      setSaving(false)
    }
  }

  return {
    showNewVesselModal,
    setShowNewVesselModal,
    newVesselName,
    setNewVesselName,
    handleCreateNewVessel,
    saving
  }
}

