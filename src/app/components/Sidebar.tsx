"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from './SidebarLayout'
import { useAuth } from '../context/AuthContext'
import { useVessel } from '../context/VesselContext'
import { useCase } from '../context/CaseContext'

export default function Sidebar() {
  const { isExpanded, setIsExpanded } = useSidebar()
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const { selectVessel, requestNewVesselModal, currentVesselId, loadingVessel, isHydrated: vesselHydrated, userVessels } = useVessel()
  const { selectedCases, caseResults, isHydrated: casesHydrated } = useCase()
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Unified hydration gate
  const appHydrated = !authLoading && vesselHydrated && casesHydrated && isHydrated

  // Simple hydration marker (no vessel loading needed - context handles it)
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Note: Vessel fetching is now handled by VesselContext
  // userVessels comes directly from context

  const handleAddVessel = () => {
    // Request new vessel modal via context (instant, no localStorage)
    // Context handles navigation if not on /cases
    requestNewVesselModal()
  }

  const handleSelectVessel = (vesselId: string) => {
    // Use direct method - works from any page!
    selectVessel(vesselId)
  }

  return (
    <div 
      className={`fixed left-0 top-[5.5rem] h-[calc(100vh-5.5rem)] bg-gray-50 border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out z-10 sidebar-desktop-show ${
        isExpanded ? 'w-60' : 'w-12'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 pt-4">
          {/* Vessels Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>Vessels</span>
            </div>

            {!appHydrated ? (
              <div className="space-y-1 mt-2">
                <div className={`px-2 py-2 text-xs text-gray-400 italic transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>
                  <span className="whitespace-nowrap">Loading...</span>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-1 mt-2">
                {/* Show vessel list from context (loading handled by VesselContext) */}
                {userVessels.length > 0 ? (
                  userVessels.map((vessel) => {
                    const isActive = vessel.id === currentVesselId
                    return (
                      <button 
                        key={vessel.id}
                        onClick={() => handleSelectVessel(vessel.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-150 ${
                          isActive
                            ? 'bg-blue-100 text-blue-900' 
                            : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        {isActive && (
                          <svg className="w-3 h-3 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <div className={`flex-1 text-left overflow-hidden transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>
                          <div className="text-sm font-medium truncate">
                            {/* Show vessel name if tag is temporary or untitled-N format */}
                            {vessel.vessel_tag?.startsWith('temp-') || /^untitled-\d+$/.test(vessel.vessel_tag || '')
                              ? (vessel.vessel_name || 'Untitled Vessel')
                              : vessel.vessel_tag}
                          </div>
                          {/* Show name as subtitle only for real tags (not temp- or untitled-N) */}
                          {vessel.vessel_name && !vessel.vessel_tag?.startsWith('temp-') && !/^untitled-\d+$/.test(vessel.vessel_tag || '') ? (
                            <div className="text-xs text-gray-500 truncate">
                              {vessel.vessel_name}
                            </div>
                          ) : (
                            <div className="text-xs text-transparent">Placeholder</div>
                          )}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className={`px-2 py-2 text-xs text-gray-500 italic transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>
                    <span className="whitespace-nowrap">No vessels yet</span>
                  </div>
                )}
                
                {/* Add Vessel Button */}
                <button 
                  onClick={handleAddVessel}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-150 text-blue-600 hover:bg-blue-50"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>Add Vessel</span>
                </button>
              </div>
            ) : (
              <div className={`px-2 py-2 text-xs text-gray-500 italic transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>
                <span className="whitespace-nowrap">Sign in to manage vessels</span>
              </div>
            )}
          </div>

          <div className="my-2 border-t border-gray-200"></div>

          {/* Cases Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>Cases</span>
            </div>

            {/* Toggled Cases List */}
            <div className="space-y-1 mt-2">
              {Object.entries(selectedCases)
                .filter(([, isSelected]) => isSelected)
                .map(([caseId]) => {
                  const result = caseResults[caseId as keyof typeof caseResults]
                  const caseRoute = `/cases/${caseId}`
                  const isActive = pathname === caseRoute
                  
                  // Shorten case names for sidebar display
                  let displayName = result.caseName
                  if (displayName === 'Control Valve Failure (Gas)') {
                    displayName = 'Control Valve Failure'
                  } else if (displayName === 'Heat Exchanger Tube Rupture') {
                    displayName = 'HX Tube Rupture'
                  }
                  
                  return (
                    <Link 
                      key={caseId}
                      href={caseRoute}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-150 ${
                        isActive
                          ? 'bg-gray-200 text-gray-900' 
                          : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      {result.isCalculated && (
                        <svg className="w-3 h-3 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <div className={`flex-1 text-left overflow-hidden transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>
                        <div className="text-sm truncate">
                          {displayName}
                        </div>
                        {result.isCalculated && result.asmeVIIIDesignFlow !== null ? (
                          <div className="text-xs text-gray-500 truncate">
                            {result.asmeVIIIDesignFlow.toFixed(0)} lb/hr
                          </div>
                        ) : (
                          <div className="text-xs text-transparent">Placeholder</div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              
              {/* Show message if no cases toggled - use invisible pattern to prevent layout shift */}
              {Object.values(selectedCases).every(selected => !selected) && (
                <div className={`px-2 py-2 text-xs text-gray-500 italic transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>
                  <span className="whitespace-nowrap">No cases selected</span>
                </div>
              )}
            </div>
          </div>

          <div className="my-2 border-t border-gray-200"></div>

          {/* Reference Data Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>Reference Data</span>
            </div>
            
            <div className="space-y-1 mt-2">
              <Link 
                href="/datasets/fluids"
                className={`flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-150 ${
                  pathname === '/datasets/fluids'
                    ? 'bg-gray-200 text-gray-900' 
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span className={`text-sm whitespace-nowrap transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>Fluids</span>
              </Link>

              <Link 
                href="/datasets/gas-properties"
                className={`flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-150 ${
                  pathname === '/datasets/gas-properties'
                    ? 'bg-gray-200 text-gray-900' 
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className={`text-sm whitespace-nowrap transition-opacity duration-150 ${isExpanded ? 'visible' : 'invisible'}`}>Gas Properties</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer */}
        {isExpanded && (
          <div className="p-2 border-t border-gray-200 space-y-2">
            <div className="flex gap-3 text-xs text-gray-500 font-inter">
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">
                Terms
              </Link>
            </div>
            <div className="text-sm text-gray-500 font-inter whitespace-nowrap">
              {/* ReliefGuard */}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}