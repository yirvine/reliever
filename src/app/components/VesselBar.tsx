'use client'

/**
 * VesselBar Component
 * 
 * Compact vessel selector and management bar shown above the scenarios list.
 * Provides quick access to:
 * - Current vessel dropdown (select from user's saved vessels)
 * - New Vessel button (clears contexts and prompts for vessel name)
 * - Save button (saves current vessel + cases to database)
 * 
 * Requires authentication for Save/New - opens AuthModal if not logged in.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useVessel } from '../context/VesselContext'
import { useCase } from '../context/CaseContext'
import { auth } from '@/lib/firebase/config'

interface VesselBarProps {
  onLoginRequired: () => void // Callback to open AuthModal
}

interface SavedVessel {
  id: string
  vessel_tag: string
  vessel_name: string | null
  updated_at: string
}

export default function VesselBar({ onLoginRequired }: VesselBarProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { vesselData, updateVesselData, registerSaveCallback, currentVesselId, setCurrentVesselId, triggerVesselsUpdate, loadingVessel, setLoadingVessel, setLoadingMessage } = useVessel()
  const { refreshFromStorage } = useCase()
  const [showNewVesselModal, setShowNewVesselModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newVesselName, setNewVesselName] = useState('')
  const [saving, setSaving] = useState(false)
  const [userVessels, setUserVessels] = useState<SavedVessel[]>([])

  // Register save callback for auto-save
  useEffect(() => {
    registerSaveCallback(handleSave)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user vessels when logged in
  useEffect(() => {
    if (user) {
      fetchUserVessels()
    }
    // Don't clear vessels/currentVesselId when user becomes null
    // (happens during auth initialization on refresh)
    // AuthContext already handles clearing on actual logout
  }, [user])

  // Check for pending vessel to load (from Sidebar vessel selection)
  // This runs on every render to catch vessel clicks even when already on /cases
  useEffect(() => {
    const pendingVesselId = localStorage.getItem('reliever-pending-vessel-id')
    if (pendingVesselId && pendingVesselId !== currentVesselId && !loadingVessel) {
      // Clear the flag immediately to prevent re-triggering
      localStorage.removeItem('reliever-pending-vessel-id')
      // Load the pending vessel
      handleSelectVessel(pendingVesselId)
    }
    
    // Check for new vessel request
    const newVesselRequested = localStorage.getItem('reliever-new-vessel-requested')
    if (newVesselRequested === 'true' && !loadingVessel) {
      localStorage.removeItem('reliever-new-vessel-requested')
      handleNewVessel()
    }
  }) // No dependencies - check on every render

  const fetchUserVessels = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return

      const response = await fetch('/api/vessels', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const vessels = data.vessels || []
        setUserVessels(vessels)
        // Update cache to keep Sidebar in sync
        localStorage.setItem('reliever-vessels-cache', JSON.stringify(vessels))
        
        // Prefetch all vessel data in the background for instant switching
        prefetchAllVessels(vessels, idToken)
      }
    } catch (error) {
      console.error('Failed to fetch vessels:', error)
    }
  }

  // Prefetch all vessels' data and cases in the background for instant loading
  const prefetchAllVessels = async (vessels: SavedVessel[], idToken: string) => {
    if (!vessels || vessels.length === 0) return
    
    try {
      // Fetch all vessels in parallel (non-blocking)
      await Promise.all(
        vessels.map(async (vessel) => {
          try {
            // Fetch vessel data and cases in parallel
            const [vesselResponse, casesResponse] = await Promise.all([
              fetch(`/api/vessels/${vessel.id}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
              }),
              fetch(`/api/vessels/${vessel.id}/cases`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
              })
            ])

            if (vesselResponse.ok) {
              const vesselData = await vesselResponse.json()
              // Cache vessel data
              localStorage.setItem(`reliever-vessel-${vessel.id}`, JSON.stringify(vesselData.vessel))
            }

            if (casesResponse.ok) {
              const casesData = await casesResponse.json()
              // Cache cases data
              if (casesData.cases) {
                localStorage.setItem(`reliever-vessel-cases-${vessel.id}`, JSON.stringify(casesData.cases))
              }
            }
          } catch (err) {
            // Silently fail for individual vessels - don't block other prefetches
            console.warn(`Failed to prefetch vessel ${vessel.id}:`, err)
          }
        })
      )
    } catch (error) {
      console.warn('Prefetch error:', error)
    }
  }

  const collectCaseDataFromLocalStorage = () => {
    const caseTypes = [
      'external-fire',
      'control-valve-failure',
      'liquid-overfill',
      'blocked-outlet',
      'cooling-reflux-failure',
      'hydraulic-expansion',
      'heat-exchanger-tube-rupture'
    ]

    // Get selection state and results from localStorage
    const selectedCasesData = localStorage.getItem('reliever-selected-cases')
    const selectedCases = selectedCasesData ? JSON.parse(selectedCasesData) : {}
    
    const caseResultsData = localStorage.getItem('reliever-case-results')
    const caseResults = caseResultsData ? JSON.parse(caseResultsData) : {}

    return caseTypes.map(caseType => {
      const flowData = localStorage.getItem(`${caseType}-flow-data`)
      const pressureData = localStorage.getItem(`${caseType}-pressure-data`)
      
      const flowParsed = flowData ? JSON.parse(flowData) : {}
      const pressureParsed = pressureData ? JSON.parse(pressureData) : {}
      
      const result = caseResults[caseType]

      return {
        caseType,
        caseName: result?.caseName || null,
        // ONLY save user inputs - calculated values will be regenerated client-side
        flowData: flowParsed,
        pressureData: pressureParsed,
        // Save selection state and calculated results
        isSelected: selectedCases[caseType] || false,
        isCalculated: result?.isCalculated || false,
        asmeVIIIDesignFlow: result?.asmeVIIIDesignFlow || null,
        calculatedRelievingFlow: null, // Deprecated, can be removed
      }
    })
  }

  const handleSave = async (silent = false, vesselSnapshot?: typeof vesselData, vesselIdSnapshot?: string) => {
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

  const handleNewVessel = async () => {
    // Use auth.currentUser directly to avoid stale closure
    if (!auth.currentUser) {
      onLoginRequired()
      return
    }
    
    // Auto-save current vessel if it exists (captures any unsaved changes including tag updates)
    if (currentVesselId) {
      // Capture snapshot before clearing data
      const vesselDataSnapshot = { ...vesselData }
      const currentVesselIdSnapshot = currentVesselId
      
      // Silent auto-save (don't block on failure)
      try {
        await handleSave(true, vesselDataSnapshot, currentVesselIdSnapshot)
      } catch (error) {
        console.warn('Auto-save before new vessel:', error)
      }
    }
    
    // Show new vessel modal
    setShowNewVesselModal(true)
  }

  const clearAllData = (keepVesselId = false) => {
    // Clear vessel context (reset to defaults)
    updateVesselData('vesselTag', '')
    updateVesselData('vesselName', '')
    updateVesselData('straightSideHeight', 0)
    updateVesselData('vesselDiameter', 0)
    updateVesselData('headType', 'Hemispherical')
    updateVesselData('vesselDesignMawp', 0)
    updateVesselData('asmeSetPressure', 0)
    updateVesselData('vesselOrientation', 'vertical')
    updateVesselData('headProtectedBySkirt', false)
    updateVesselData('fireSourceElevation', 0)
    
    // Clear all case localStorage
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
    
    // Clear case selection data
    localStorage.removeItem('reliever-selected-cases')
    localStorage.removeItem('reliever-case-results')
    
    // Only clear vessel ID if not creating a new vessel
    if (!keepVesselId) {
      setCurrentVesselId(null)
    }
  }

  const handleCreateNewVessel = async () => {
    if (!newVesselName.trim()) {
      return
    }

    // Close modal first
    setShowNewVesselModal(false)
    setSaving(true)

    try {
      // Save the new vessel to the database FIRST (before clearing local data)
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        throw new Error('Not authenticated')
      }

      // Generate a unique temporary tag to avoid conflicts (user can change it)
      const tempTag = `temp-${Date.now()}`
      
      const vesselResponse = await fetch('/api/vessels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          vessel: {
            id: null, // New vessel
            vesselTag: tempTag, // Temporary unique tag - user can change it
            vesselName: newVesselName, // Only populate name field
            vesselOrientation: 'vertical',
            vesselDiameter: 0,
            straightSideHeight: 0,
            headType: 'Hemispherical',
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
      
      // Refresh vessels list FIRST to ensure sidebar has the new vessel
      await fetchUserVessels()
      triggerVesselsUpdate()
      
      // Set vessel ID FIRST, then clear data (keeping the ID), then update vessel info
      // This prevents the dropdown from flickering to null
      setCurrentVesselId(vesselId)
      clearAllData(true) // Keep vessel ID while clearing everything else
      updateVesselData('vesselName', newVesselName)
      // vesselTag is left empty - user will fill it in
      
      // Refresh CaseContext to pick up cleared case data
      refreshFromStorage()
      
      // Reset modal state
      setNewVesselName('')
    } catch (error) {
      console.error('Failed to create vessel:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vessel. Please try again.'
      alert(`❌ ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  // Helper function to load cases from case data array
  const loadCasesFromData = (cases: Array<{
    case_type: string
    flow_data?: Record<string, unknown>
    pressure_data?: Record<string, unknown>
    is_selected?: boolean
    calculated_relieving_flow?: number
    asme_viii_design_flow?: number
    is_calculated?: boolean
    case_name?: string
  }>) => {
    // Rebuild selectedCases and caseResults from database
    const newSelectedCases: Record<string, boolean> = {
      'external-fire': false,
      'control-valve-failure': false,
      'liquid-overfill': false,
      'blocked-outlet': false,
      'cooling-reflux-failure': false,
      'hydraulic-expansion': false,
      'heat-exchanger-tube-rupture': false
    }
    
    const newCaseResults: Record<string, unknown> = {}
    
    cases.forEach((caseData) => {
      const caseType = caseData.case_type
      
      // Restore flow and pressure data
      if (caseData.flow_data) {
        localStorage.setItem(`${caseType}-flow-data`, JSON.stringify(caseData.flow_data))
      }
      if (caseData.pressure_data) {
        localStorage.setItem(`${caseType}-pressure-data`, JSON.stringify(caseData.pressure_data))
      }
      
      // Restore selection state
      if (caseData.is_selected !== undefined) {
        newSelectedCases[caseType] = caseData.is_selected
      }
      
      // Restore case results
      if (caseData.is_calculated) {
        newCaseResults[caseType] = {
          caseId: caseType,
          caseName: caseData.case_name || '',
          asmeVIIIDesignFlow: caseData.asme_viii_design_flow,
          isCalculated: caseData.is_calculated
        }
      }
    })
    
    // ALWAYS save to localStorage for CaseContext (even if empty - to clear ghost data)
    localStorage.setItem('reliever-selected-cases', JSON.stringify(newSelectedCases))
    localStorage.setItem('reliever-case-results', JSON.stringify(newCaseResults))
  }

  const handleSelectVessel = async (vesselId: string) => {
    // If selecting 'current' placeholder or already loading, do nothing
    if (vesselId === 'current' || loadingVessel) return
    
    // If clicking the same vessel, just navigate to /cases without reloading
    if (vesselId === currentVesselId) {
      return
    }

    let hasCache = false
    
    try {
      // Get the new vessel's name for better UX messaging
      const newVessel = userVessels.find(v => v.id === vesselId)
      const newVesselDisplay = newVessel?.vessel_name || newVessel?.vessel_tag || 'vessel'
      const currentVesselDisplay = vesselData.vesselName || vesselData.vesselTag || 'current vessel'
      
      // Show loading modal immediately with descriptive message
      setLoadingMessage(`Saving ${currentVesselDisplay} and loading ${newVesselDisplay}...`)
      setLoadingVessel(true)
      
      // Auto-save current vessel first (inside the modal, so it happens while user sees feedback)
      // Always save if we have a currentVesselId (captures any changes user made, including tag updates)
      if (currentVesselId) {
        const vesselDataSnapshot = { ...vesselData }
        const currentVesselIdSnapshot = currentVesselId
        try {
          await handleSave(true, vesselDataSnapshot, currentVesselIdSnapshot)
        } catch (error) {
          console.warn('Auto-save error:', error)
        }
      }
      
      // Clear old case data immediately to prevent showing wrong vessel's cases
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
      // Clear case selection state and results
      localStorage.removeItem('reliever-selected-cases')
      localStorage.removeItem('reliever-case-results')
      // Clear case context state immediately
      refreshFromStorage()
      
      // Try to load from cache first (optimistic UI)
      const cachedVesselData = localStorage.getItem(`reliever-vessel-${vesselId}`)
      const cachedCaseData = localStorage.getItem(`reliever-vessel-cases-${vesselId}`)
      if (cachedVesselData) {
        try {
          const cached = JSON.parse(cachedVesselData)
          // Load cached vessel data immediately (prevents blank dropdown)
          updateVesselData('vesselTag', cached.vessel_tag || '')
          updateVesselData('vesselName', cached.vessel_name || '')
          updateVesselData('vesselOrientation', cached.vessel_orientation || 'vertical')
          updateVesselData('vesselDiameter', cached.vessel_diameter || 0)
          updateVesselData('straightSideHeight', cached.straight_side_height || 0)
          updateVesselData('headType', cached.head_type || 'Hemispherical')
          updateVesselData('vesselDesignMawp', cached.vessel_design_mawp || 0)
          updateVesselData('asmeSetPressure', cached.asme_set_pressure || 0)
          setCurrentVesselId(vesselId)
          
          // Load cached case data if available
          if (cachedCaseData) {
            const cases = JSON.parse(cachedCaseData)
            loadCasesFromData(cases)
            refreshFromStorage()
          }
          
          hasCache = true
          // Close loading modal immediately - cached data is loaded!
          setLoadingVessel(false)
        } catch (error) {
          console.warn('Failed to load cached vessel:', error)
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
        throw new Error('Failed to load vessel')
      }

      const vesselDataResponse = await vesselResponse.json()
      const vessel = vesselDataResponse.vessel

      // Cache vessel data for future instant loading
      localStorage.setItem(`reliever-vessel-${vesselId}`, JSON.stringify(vessel))

      // Load all vessel properties at once
      updateVesselData('vesselTag', vessel.vessel_tag || '')
      updateVesselData('vesselName', vessel.vessel_name || '')
      updateVesselData('vesselOrientation', vessel.vessel_orientation || 'vertical')
      updateVesselData('vesselDiameter', vessel.vessel_diameter || 0)
      updateVesselData('straightSideHeight', vessel.straight_side_height || 0)
      updateVesselData('headType', vessel.head_type || 'Hemispherical')
      updateVesselData('vesselDesignMawp', vessel.vessel_design_mawp || 0)
      updateVesselData('asmeSetPressure', vessel.asme_set_pressure || 0)

      // Load all cases into localStorage at once
      if (casesResponse.ok) {
        const casesData = await casesResponse.json()
        const cases = casesData.cases || []
        
        // Cache case data for future instant loading
        localStorage.setItem(`reliever-vessel-cases-${vesselId}`, JSON.stringify(cases))
        
        // Load cases using helper function
        loadCasesFromData(cases)
      }

      // Refresh CaseContext to pick up the new localStorage data
      refreshFromStorage()

      // Set current vessel ID after all data is loaded (if not already set from cache)
      if (!hasCache) {
        setCurrentVesselId(vesselId)
        setLoadingVessel(false)
      }
      // If we had cache, data is already loaded and modal is closed - no need to do anything
    } catch (error) {
      console.error('Failed to load vessel:', error)
      if (!hasCache) {
        setCurrentVesselId(null)
        setLoadingVessel(false)
      }
    }
  }

  const handleDeleteClick = () => {
    if (!currentVesselId) {
      return
    }
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
      clearAllData()
      refreshFromStorage()
      
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
            loadCasesFromData(cases)
          }

          refreshFromStorage()
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

  // Show tag if available (and not temporary), otherwise name, otherwise "Untitled Vessel"
  const isTemporaryTag = vesselData.vesselTag?.startsWith('temp-')
  const currentVesselDisplay = (vesselData.vesselTag && !isTemporaryTag) 
    ? vesselData.vesselTag 
    : (vesselData.vesselName || 'Untitled Vessel')
  // Only show name suffix if we're showing a real tag (not temporary) and have a name
  const vesselNameSuffix = (vesselData.vesselTag && !isTemporaryTag && vesselData.vesselName) 
    ? ` - ${vesselData.vesselName}` 
    : ''

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        {/* Vessel Dropdown */}
        <div className="flex items-center gap-2 flex-1">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <select 
            className="flex-1 max-w-md text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={currentVesselId || 'current'}
            disabled={(!user && !authLoading) || (userVessels.length === 0 && !currentVesselId)}
            onChange={(e) => handleSelectVessel(e.target.value)}
          >
            {/* Show unsaved vessel only if no currentVesselId */}
            {!currentVesselId && (
              <option value="current">
                {currentVesselDisplay}{vesselNameSuffix}
              </option>
            )}
            {/* Show all saved vessels - the select's value prop will highlight the current one */}
            {userVessels.map(vessel => {
              const isTemp = vessel.vessel_tag?.startsWith('temp-')
              const displayName = isTemp 
                ? (vessel.vessel_name || 'Untitled Vessel')
                : vessel.vessel_tag
              const suffix = (!isTemp && vessel.vessel_name) ? ` - ${vessel.vessel_name}` : ''
              
              return (
                <option key={vessel.id} value={vessel.id}>
                  {displayName}{suffix}
                </option>
              )
            })}
          </select>
        </div>

          {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* New Vessel Button */}
          <button
            onClick={handleNewVessel}
            disabled={!user && !authLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={user ? 'Create a new vessel' : 'Sign in to create vessels'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Vessel
          </button>

          {/* Save and Delete Buttons */}
          {(user || authLoading) && (
            <>
              <button
                onClick={() => handleSave()}
                disabled={saving || authLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {saving ? 'Saving...' : 'Save'}
              </button>

              {/* Delete Button - Only show if there's a saved vessel loaded */}
              {currentVesselId && (
                <button
                  onClick={handleDeleteClick}
                  disabled={authLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Delete this vessel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </>
          )}

          {/* Login prompt if not logged in */}
          {!user && !authLoading && (
            <button
              onClick={onLoginRequired}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Sign in to save
            </button>
          )}
        </div>
      </div>

      {/* New Vessel Modal */}
      {showNewVesselModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Vessel</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a name for your new vessel.
            </p>
            
            <div className="mb-4">
              <label htmlFor="vessel-name" className="block text-sm font-medium text-gray-700 mb-2">
                Vessel Name
              </label>
              <input
                id="vessel-name"
                type="text"
                value={newVesselName}
                onChange={(e) => setNewVesselName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newVesselName.trim() && !saving) {
                    handleCreateNewVessel()
                  }
                }}
                placeholder="e.g., Acetone Storage Tank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                autoFocus
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can set the vessel tag (V-102, etc.) in the vessel properties below
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateNewVessel}
                disabled={saving || !newVesselName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Vessel'}
              </button>
              <button
                onClick={() => {
                  setShowNewVesselModal(false)
                  setNewVesselName('')
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Vessel?</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete <strong>{currentVesselDisplay}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete the vessel and all associated case data. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Vessel'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

