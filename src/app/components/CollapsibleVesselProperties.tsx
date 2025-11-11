'use client'

import { useState, useEffect } from 'react'
import { useVessel } from '../context/VesselContext'
import VesselProperties from './VesselProperties'
import EditWarningModal, { shouldShowEditWarning } from './EditWarningModal'

const MAIN_PAGE_COLLAPSE_KEY = 'reliever-vessel-properties-main-collapsed'
const CASE_PAGE_COLLAPSE_KEY = 'reliever-vessel-properties-case-collapsed'

interface CollapsibleVesselPropertiesProps {
  defaultExpanded?: boolean // For main page, default to expanded
  showEditButton?: boolean // Hide edit button on main page
}

export default function CollapsibleVesselProperties({ defaultExpanded = false, showEditButton = true }: CollapsibleVesselPropertiesProps) {
  // Use different localStorage keys for main page vs case pages
  const collapseKey = showEditButton ? CASE_PAGE_COLLAPSE_KEY : MAIN_PAGE_COLLAPSE_KEY

  // Initialize with default to prevent hydration mismatch
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration
  useEffect(() => {
    const savedState = localStorage.getItem(collapseKey)
    if (savedState !== null) {
      setIsExpanded(savedState !== 'true') // 'true' means collapsed, so expanded = false
    }
    setIsHydrated(true)
  }, [collapseKey])

  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { vesselData, updateVesselData } = useVessel()

  // Save collapsed state to localStorage when it changes (only after hydration)
  const handleToggleExpand = () => {
    if (!isEditing) {
      const newExpanded = !isExpanded
      setIsExpanded(newExpanded)
      if (isHydrated) {
        localStorage.setItem(collapseKey, (!newExpanded).toString()) // Store inverse (collapsed state)
      }
    }
  }

  const handleEditClick = () => {
    if (shouldShowEditWarning()) {
      setShowModal(true)
    } else {
      setIsEditing(true)
      setIsExpanded(true)
    }
  }

  const handleProceed = () => {
    setIsEditing(true)
    setIsExpanded(true)
  }

  const handleSave = () => {
    setIsEditing(false)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header - Always visible */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleToggleExpand}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Vessel Properties</h2>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                {showEditButton && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick()
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSave()
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>

        {/* Expandable Content */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 border-t border-gray-200">
            <div className="mt-4">
              <VesselProperties
                vesselData={vesselData}
                onChange={updateVesselData}
                hideWorkingFluid={true}
                disabled={showEditButton ? !isEditing : false}
                hideHeading={true}
              />
            </div>
          </div>
        </div>
      </div>

      <EditWarningModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProceed={handleProceed}
      />
    </>
  )
}

