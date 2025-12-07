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
 * 
 * Refactored into custom hooks for better organization:
 * - useVesselSaver: Save and auto-save logic
 * - useVesselLoader: Vessel switching, caching, and loading
 * - useNewVesselModal: New vessel creation flow
 * - useVesselDeleter: Vessel deletion flow
 */

import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'
import { auth } from '@/lib/firebase/config'

import { useVesselSaver } from './useVesselSaver'
import { useVesselLoader } from './useVesselLoader'
import { useNewVesselModal } from './useNewVesselModal'
import { useVesselDeleter } from './useVesselDeleter'

interface VesselBarProps {
  onLoginRequired: () => void // Callback to open AuthModal
  inline?: boolean // Render inline (no card wrapper) for embedding in headers
}

export default function VesselBar({ onLoginRequired, inline = false }: VesselBarProps) {
  const { user, loading: authLoading } = useAuth()
  const { 
    vesselData, 
    updateVesselData, 
    registerSaveCallback, 
    currentVesselId, 
    setCurrentVesselId, 
    pendingVesselId, 
    setPendingVesselId, 
    triggerVesselsUpdate, 
    setLoadingVessel, 
    setLoadingMessage, 
    userVessels, 
    fetchUserVessels, 
    updateVesselInList, 
    openNewVesselModal, 
    newVesselModalRequested, 
    clearNewVesselModalRequest 
  } = useVessel()
  const { applyCaseData } = useCase()

  // Initialize custom hooks
  const { handleSave, saving } = useVesselSaver({
    currentVesselId,
    setCurrentVesselId,
    vesselData,
    fetchUserVessels,
    updateVesselInList,
    triggerVesselsUpdate,
    onLoginRequired
  })

  const { handleSelectVessel, lastHandledVesselIdRef } = useVesselLoader({
    currentVesselId,
    setCurrentVesselId,
    vesselData,
    updateVesselData,
    applyCaseData,
    setLoadingVessel,
    setLoadingMessage,
    handleSave
  })

  const {
    showNewVesselModal,
    setShowNewVesselModal,
    newVesselName,
    setNewVesselName,
    handleCreateNewVessel,
    saving: creatingVessel
  } = useNewVesselModal({
    userVessels,
    fetchUserVessels,
    setLoadingVessel,
    setLoadingMessage,
    handleSelectVessel
  })

  const {
    showDeleteModal,
    setShowDeleteModal,
    deleting,
    vesselToDeleteName,
    handleDeleteClick,
    handleDeleteConfirm
  } = useVesselDeleter({
    currentVesselId,
    setCurrentVesselId,
    vesselData,
    updateVesselData,
    applyCaseData,
    fetchUserVessels,
    triggerVesselsUpdate
  })

  // Register save callback for auto-save
  useEffect(() => {
    registerSaveCallback(handleSave)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pending vessel selection (triggered by context state change)
  useEffect(() => {
    if (pendingVesselId && pendingVesselId !== currentVesselId) {
      // Skip if we've already handled this vessel ID
      if (lastHandledVesselIdRef.current === pendingVesselId) {
        console.log('⚠️ Already handled vessel switch to', pendingVesselId, '- skipping duplicate')
        return
      }
      
      lastHandledVesselIdRef.current = pendingVesselId
      handleSelectVessel(pendingVesselId)
      // Clear pending state immediately to prevent duplicate calls
      setPendingVesselId(null)
    }
  }, [pendingVesselId]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Watch context for new vessel modal request (instant, no localStorage)
  useEffect(() => {
    if (newVesselModalRequested) {
      // Clear the request immediately
      clearNewVesselModalRequest()
      
      // Check auth
      if (!auth.currentUser) {
        onLoginRequired()
        return
      }
      
      // Show modal instantly - no auto-save before opening
      setShowNewVesselModal(true)
    }
  }, [newVesselModalRequested, clearNewVesselModalRequest, onLoginRequired, setShowNewVesselModal])

  const handleNewVesselClick = () => {
    if (!user) {
      onLoginRequired()
    } else {
      openNewVesselModal()
    }
  }

  // Shared content (dropdown + buttons)
  const content = (
    <>
      {/* Vessel Dropdown - Only show if logged in */}
      {user && (
        <div className={inline ? "flex-1 max-w-md ml-4" : "flex items-center gap-2 flex-1"}>
          {!inline && (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )}
          <select 
            className={inline 
              ? "w-full text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              : "flex-1 max-w-md text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            }
            value={currentVesselId || 'current'}
            disabled={userVessels.length === 0 && !currentVesselId}
            onChange={(e) => handleSelectVessel(e.target.value)}
          >
            {!currentVesselId && (
              <option value="current">
                {vesselData.vesselTag || vesselData.vesselName || 'Current Vessel'}
              </option>
            )}
            {userVessels.map(vessel => {
              const isPlaceholderTag = vessel.vessel_tag?.startsWith('temp-') || /^untitled-\d+$/.test(vessel.vessel_tag || '')
              const displayName = vessel.vessel_name || 'Untitled Vessel'
              const suffix = (!isPlaceholderTag && vessel.vessel_tag) ? ` - ${vessel.vessel_tag}` : ''
              return (
                <option key={vessel.id} value={vessel.id}>
                  {displayName}{suffix}
                </option>
              )
            })}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className={inline ? "flex items-center gap-3 shrink-0 ml-auto" : "flex items-center gap-2"}>
        <button
          onClick={handleNewVesselClick}
          className={inline 
            ? "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            : "flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          }
          title={user ? 'Create a new vessel' : 'Sign in to create vessels'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Vessel
        </button>

        {user && (
          <>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className={inline
                ? "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                : "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {saving ? 'Saving...' : 'Save'}
            </button>

            {currentVesselId && (
              <button
                onClick={handleDeleteClick}
                className={inline
                  ? "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  : "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                }
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
      </div>
    </>
  )

  // Return content with or without card wrapper
  return (
    <>
      {inline ? (
        content
      ) : (
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          {content}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newVesselName.trim() && !creatingVessel) {
                    handleCreateNewVessel()
                  }
                }}
                placeholder="e.g., Acetone Storage Tank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                autoFocus
                disabled={creatingVessel}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can set the vessel tag (V-102, etc.) in the vessel properties below
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateNewVessel}
                disabled={creatingVessel || !newVesselName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingVessel ? 'Creating...' : 'Create Vessel'}
              </button>
              <button
                onClick={() => {
                  setShowNewVesselModal(false)
                  setNewVesselName('')
                }}
                disabled={creatingVessel}
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
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Vessel?</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete <strong>{vesselToDeleteName}</strong>?
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

