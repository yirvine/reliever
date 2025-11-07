'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ResetCaseFieldsProps {
  onReset: () => void
  caseName: string
  disabled?: boolean
}

/**
 * Component to reset all case-specific fields to their default values.
 * Does NOT affect vessel properties as those are shared across all cases.
 */
export default function ResetCaseFields({ onReset, caseName, disabled = false }: ResetCaseFieldsProps) {
  const [showModal, setShowModal] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleReset = () => {
    onReset()
    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
          disabled
            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
        }`}
        title="Reset all case-specific fields to defaults"
      >
        <div className="flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset All Fields</span>
        </div>
      </button>

      {/* Reset Confirmation Modal - Rendered via Portal */}
      {isClient && showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 transition-opacity"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Reset all fields for {caseName}?
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-600 text-center mb-6">
              This will clear all inputs and calculations for this case only. Vessel properties will not be affected.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Reset Fields
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

