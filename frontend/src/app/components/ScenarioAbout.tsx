'use client'

import { useState } from 'react'

interface ScenarioAboutProps {
  children: React.ReactNode
}

/**
 * Reusable collapsible "About this scenario" component
 * Used across all case pages to provide context and explanation
 */
export default function ScenarioAbout({ children }: ScenarioAboutProps) {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      {/* Collapsible About Button */}
      <div className={showAbout ? 'mb-2' : 'mb-1'}>
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="inline-flex items-center text-base text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
        >
          <svg 
            className={`w-4 h-4 mr-1 transition-transform duration-200 ${showAbout ? 'rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          About this scenario
        </button>
      </div>

      {/* Expanded About Section - Full Width */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showAbout ? 'max-h-[800px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          {children}
        </div>
      </div>
    </>
  )
}

