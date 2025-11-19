/**
 * useVesselDeleter Hook
 * 
 * Handles vessel deletion flow:
 * - Delete confirmation modal
 * - Vessel deletion API call
 * - Cache cleanup
 * - Loading next vessel or navigating home
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/config'
import { clearAllData, loadCasesFromData } from './vesselHelpers'
import { type CaseId, type CaseResult } from '../../context/CaseContext'
import { type VesselData } from '../../context/VesselContext'

interface UseVesselDeleterProps {
  currentVesselId: string | null
  setCurrentVesselId: (id: string | null) => void
  vesselData: VesselData
  updateVesselData: (field: keyof VesselData, value: string | number | boolean) => void
  applyCaseData: (selectedCases: Record<CaseId, boolean>, caseResults: Record<CaseId, CaseResult>) => void
  fetchUserVessels: () => Promise<void>
  triggerVesselsUpdate: () => void
}

export function useVesselDeleter({
  currentVesselId,
  setCurrentVesselId,
  vesselData,
  updateVesselData,
  applyCaseData,
  fetchUserVessels,
  triggerVesselsUpdate
}: UseVesselDeleterProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [vesselToDeleteName, setVesselToDeleteName] = useState('')

  const handleDeleteClick = () => {
    if (!currentVesselId) {
      return
    }
    // Capture vessel name before opening modal (state will be cleared during delete)
    const isTemporaryTag = vesselData.vesselTag?.startsWith('temp-')
    const displayName = (vesselData.vesselTag && !isTemporaryTag) 
      ? vesselData.vesselTag 
      : (vesselData.vesselName || 'Untitled Vessel')
    setVesselToDeleteName(displayName)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentVesselId) {
      return
    }

    setDeleting(true)

    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        setDeleting(false)
        return
      }

      const response = await fetch(`/api/vessels/${currentVesselId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete vessel')
      }

      // Clear vessels cache AND current vessel ID to prevent stale data on refresh
      localStorage.removeItem('reliever-vessels-cache')
      localStorage.removeItem('reliever-current-vessel-id')
      // Clear cached vessel and case data for the deleted vessel
      localStorage.removeItem(`reliever-vessel-${currentVesselId}`)
      localStorage.removeItem(`reliever-vessel-cases-${currentVesselId}`)
      
      // Refresh vessels list to get updated list without deleted vessel
      await fetchUserVessels()
      
      // Check if there are other vessels to switch to
      const updatedVessels = await (async () => {
        const response = await fetch('/api/vessels', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        })
        if (response.ok) {
          const data = await response.json()
          return data.vessels || []
        }
        return []
      })()
      
      // THOROUGHLY clear ALL localStorage case data to remove ghost cases
      const caseTypes = [
        'external-fire',
        'control-valve-failure',
        'liquid-overfill',
        'blocked-outlet',
        'cooling-reflux-failure',
        'hydraulic-expansion',
        'heat-exchanger-tube-rupture'
      ]
      caseTypes.forEach(caseType => {
        localStorage.removeItem(`${caseType}-flow-data`)
        localStorage.removeItem(`${caseType}-pressure-data`)
      })
      localStorage.removeItem('reliever-selected-cases')
      localStorage.removeItem('reliever-case-results')
      
      // Clear all vessel and case context (this sets currentVesselId to null)
      clearAllData(updateVesselData, setCurrentVesselId)
      
      // Clear CaseContext state
      applyCaseData(
        {
          'external-fire': false,
          'control-valve-failure': false,
          'liquid-overfill': false,
          'blocked-outlet': false,
          'cooling-reflux-failure': false,
          'hydraulic-expansion': false,
          'heat-exchanger-tube-rupture': false
        },
        {} as Record<CaseId, CaseResult>
      )
      
      if (updatedVessels.length > 0) {
        // Load the next vessel directly (skip auto-save logic since we just deleted)
        const firstVessel = updatedVessels[0]
        
        // Load vessel data and cases directly without auto-save
        const [vesselResponse, casesResponse] = await Promise.all([
          fetch(`/api/vessels/${firstVessel.id}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          }),
          fetch(`/api/vessels/${firstVessel.id}/cases`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          })
        ])

        if (vesselResponse.ok) {
          const vesselDataResponse = await vesselResponse.json()
          const vessel = vesselDataResponse.vessel

          // Load vessel properties
          updateVesselData('vesselTag', vessel.vessel_tag || '')
          updateVesselData('vesselName', vessel.vessel_name || '')
          updateVesselData('vesselOrientation', vessel.vessel_orientation || 'vertical')
          updateVesselData('vesselDiameter', vessel.vessel_diameter || 0)
          updateVesselData('straightSideHeight', vessel.straight_side_height || 0)
          updateVesselData('headType', vessel.head_type || 'Hemispherical')
          updateVesselData('vesselDesignMawp', vessel.vessel_design_mawp || 0)
          updateVesselData('asmeSetPressure', vessel.asme_set_pressure || 0)

          // Load cases
          if (casesResponse.ok) {
            const casesData = await casesResponse.json()
            const cases = casesData.cases || []
            loadCasesFromData(cases, applyCaseData)
          }

          // loadCasesFromData already calls applyCaseData, no need to refresh
          setCurrentVesselId(firstVessel.id)
        }
      } else {
        // No vessels left, navigate to home
        router.push('/')
      }
      
      triggerVesselsUpdate()
      
      // Close modal only after everything is complete
      setShowDeleteModal(false)
      setDeleting(false)
    } catch (error) {
      console.error('Failed to delete vessel:', error)
      setDeleting(false)
      setShowDeleteModal(false)
      alert('❌ Failed to delete vessel. Please try again.')
    }
  }

  return {
    showDeleteModal,
    setShowDeleteModal,
    deleting,
    vesselToDeleteName,
    handleDeleteClick,
    handleDeleteConfirm
  }
}

