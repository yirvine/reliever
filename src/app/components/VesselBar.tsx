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
  const { user } = useAuth()
  const { vesselData, updateVesselData, registerVesselCallbacks, currentVesselId, setCurrentVesselId, triggerVesselsUpdate } = useVessel()
  const [showNewVesselModal, setShowNewVesselModal] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [newVesselName, setNewVesselName] = useState('')
  const [saving, setSaving] = useState(false)
  const [userVessels, setUserVessels] = useState<SavedVessel[]>([])

  // Register callbacks with VesselContext so Sidebar can trigger them
  useEffect(() => {
    registerVesselCallbacks({
      onNewVessel: handleNewVessel,
      onSelectVessel: handleSelectVessel
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user vessels when logged in
  useEffect(() => {
    if (user) {
      fetchUserVessels()
    } else {
      setUserVessels([])
      setCurrentVesselId(null)
    }
  }, [user, setCurrentVesselId])

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
        setUserVessels(data.vessels || [])
      }
    } catch (error) {
      console.error('Failed to fetch vessels:', error)
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

    return caseTypes.map(caseType => {
      const flowData = localStorage.getItem(`${caseType}-flow-data`)
      const pressureData = localStorage.getItem(`${caseType}-pressure-data`)
      
      const flowParsed = flowData ? JSON.parse(flowData) : {}
      const pressureParsed = pressureData ? JSON.parse(pressureData) : {}

      return {
        caseType,
        caseName: null,
        // ONLY save user inputs - calculated values will be regenerated client-side
        flowData: flowParsed,
        pressureData: pressureParsed,
      }
    })
  }

  const handleSave = async () => {
    if (!user) {
      onLoginRequired()
      return
    }

    setSaving(true)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('No auth token')

      // Save vessel
      const vesselResponse = await fetch('/api/vessels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          vessel: {
            id: currentVesselId,
            vesselTag: vesselData.vesselTag,
            vesselName: vesselData.vesselName,
            vesselOrientation: vesselData.vesselOrientation,
            vesselDiameter: vesselData.vesselDiameter,
            straightSideHeight: vesselData.straightSideHeight,
            headType: vesselData.headType,
            vesselDesignMawp: vesselData.vesselDesignMawp,
            asmeSetPressure: vesselData.asmeSetPressure,
          }
        })
      })

      if (!vesselResponse.ok) {
        const errorData = await vesselResponse.json()
        throw new Error(errorData.error || 'Failed to save vessel')
      }

      const savedVesselData = await vesselResponse.json()
      const vesselId = savedVesselData.vessel.id
      setCurrentVesselId(vesselId)

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
        throw new Error(errorData.error || 'Failed to save cases')
      }

      // Refresh vessels list
      await fetchUserVessels()
      triggerVesselsUpdate() // Notify Sidebar to refresh
    } catch (error) {
      console.error('Failed to save vessel:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save vessel. Please try again.'
      alert(`❌ ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleNewVessel = () => {
    if (!user) {
      onLoginRequired()
      return
    }
    
    // Check if there's unsaved work
    const hasVesselData = vesselData.vesselTag && vesselData.vesselTag.trim() !== ''
    
    if (hasVesselData && currentVesselId === null) {
      // Show save prompt first
      setShowSavePrompt(true)
    } else {
      // No unsaved work, go straight to new vessel
      setShowNewVesselModal(true)
    }
  }

  const handleSaveAndCreateNew = async () => {
    setShowSavePrompt(false)
    setSaving(true)
    
    try {
      await handleSave()
      // After save, show new vessel modal
      setShowNewVesselModal(true)
    } catch (error) {
      console.error('Error saving before new vessel:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSkipSaveAndCreateNew = () => {
    setShowSavePrompt(false)
    setShowNewVesselModal(true)
  }

  const clearAllData = () => {
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
    
    // Note: CaseContext selection will clear automatically when localStorage is empty
    setCurrentVesselId(null)
  }

  const handleCreateNewVessel = () => {
    if (!newVesselName.trim()) {
      return
    }

    // Clear all data and start fresh
    clearAllData()
    
    // Set the new vessel name
    updateVesselData('vesselName', newVesselName)
    
    // Close modal and reset
    setShowNewVesselModal(false)
    setNewVesselName('')
  }

  const handleSelectVessel = async (vesselId: string) => {
    // If selecting the current vessel, do nothing
    if (vesselId === currentVesselId || vesselId === 'current') return

    try {
      // Update UI immediately for smooth transition
      setCurrentVesselId(vesselId)

      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return

      // Fetch vessel data
      const vesselResponse = await fetch(`/api/vessels/${vesselId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!vesselResponse.ok) {
        throw new Error('Failed to load vessel')
      }

      const vesselDataResponse = await vesselResponse.json()
      const vessel = vesselDataResponse.vessel

      // Load vessel properties into context
      updateVesselData('vesselTag', vessel.vessel_tag || '')
      updateVesselData('vesselName', vessel.vessel_name || '')
      updateVesselData('vesselOrientation', vessel.vessel_orientation || 'vertical')
      updateVesselData('vesselDiameter', vessel.vessel_diameter || 0)
      updateVesselData('straightSideHeight', vessel.straight_side_height || 0)
      updateVesselData('headType', vessel.head_type || 'Hemispherical')
      updateVesselData('vesselDesignMawp', vessel.vessel_design_mawp || 0)
      updateVesselData('asmeSetPressure', vessel.asme_set_pressure || 0)

      // Fetch cases for this vessel
      const casesResponse = await fetch(`/api/vessels/${vesselId}/cases`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (casesResponse.ok) {
        const casesData = await casesResponse.json()
        const cases = casesData.cases || []

        // Load cases into localStorage
        interface CaseData {
          case_type: string
          flow_data?: Record<string, unknown>
          pressure_data?: Record<string, unknown>
        }
        cases.forEach((caseData: CaseData) => {
          const caseType = caseData.case_type
          if (caseData.flow_data) {
            localStorage.setItem(`${caseType}-flow-data`, JSON.stringify(caseData.flow_data))
          }
          if (caseData.pressure_data) {
            localStorage.setItem(`${caseType}-pressure-data`, JSON.stringify(caseData.pressure_data))
          }
        })
      }
    } catch (error) {
      console.error('Failed to load vessel:', error)
      // Revert currentVesselId on error
      setCurrentVesselId(null)
    }
  }

  const handleDelete = async () => {
    if (!currentVesselId) {
      return
    }

    if (!confirm(`Are you sure you want to delete this vessel? This action cannot be undone.`)) {
      return
    }

    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return

      const response = await fetch(`/api/vessels/${currentVesselId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete vessel')
      }

      // Clear current data
      clearAllData()
      
      // Refresh vessels list
      await fetchUserVessels()
      triggerVesselsUpdate()
    } catch (error) {
      console.error('Failed to delete vessel:', error)
    }
  }

  const currentVesselDisplay = vesselData.vesselTag || 'Untitled Vessel'
  const vesselNameSuffix = vesselData.vesselName ? ` - ${vesselData.vesselName}` : ''

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
            disabled={userVessels.length === 0}
            onChange={(e) => handleSelectVessel(e.target.value)}
          >
            <option value="current">
              {currentVesselDisplay}{vesselNameSuffix}
            </option>
            {userVessels.map(vessel => (
              <option key={vessel.id} value={vessel.id}>
                {vessel.vessel_tag}{vessel.vessel_name ? ` - ${vessel.vessel_name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* New Vessel Button */}
          <button
            onClick={handleNewVessel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            title={user ? 'Create a new vessel' : 'Sign in to create vessels'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Vessel
          </button>

          {/* Save and Delete Buttons - Only show when logged in */}
          {user && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
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
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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
          {!user && (
            <button
              onClick={onLoginRequired}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Sign in to save
            </button>
          )}
        </div>
      </div>

      {/* Save Changes Prompt Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save Changes?</h3>
            <p className="text-sm text-gray-600 mb-6">
              You have unsaved changes to <strong>{currentVesselDisplay}</strong>. Would you like to save before creating a new vessel?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveAndCreateNew}
                disabled={saving}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                {saving ? 'Saving...' : 'Save & Create New'}
              </button>
              <button
                onClick={handleSkipSaveAndCreateNew}
                disabled={saving}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Don&apos;t Save
              </button>
              <button
                onClick={() => setShowSavePrompt(false)}
                disabled={saving}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                placeholder="e.g., Acetone Storage Tank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                You can set the vessel tag (V-102, etc.) in the vessel properties below
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateNewVessel}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Vessel
              </button>
              <button
                onClick={() => {
                  setShowNewVesselModal(false)
                  setNewVesselName('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
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

