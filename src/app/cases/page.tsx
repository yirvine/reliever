'use client'

import { useMemo, useState } from 'react'
import Header from '../components/Header'
import PageTransition from '../components/PageTransition'
import CollapsibleVesselProperties from '../components/CollapsibleVesselProperties'
import ASMEWarningModal from '../components/ASMEWarningModal'
import CaseCard from '../components/CaseCard'
import VesselBar from '../components/VesselBar'
import AuthModal from '../components/AuthModal'
import { useCase } from '../context/CaseContext'
import { useVessel } from '../context/VesselContext'
import { useAuth } from '../context/AuthContext'
import { useScrollPosition } from '../hooks/useScrollPosition'
import { useReportGenerator } from '../hooks/useReportGenerator'

export default function Calculator() {
  const { selectedCases, caseResults, toggleCase, getDesignBasisFlow, getSelectedCaseCount, hasCalculatedResults, isHydrated: casesHydrated } = useCase()
  const { vesselData, isHydrated: vesselHydrated } = useVessel()
  const { loading: authLoading } = useAuth()
  const { generateReport, isGenerating } = useReportGenerator()
  
  // Recalculate design basis flow whenever caseResults changes (e.g., auto-recalc from geometry changes)
  const designBasisFlow = useMemo(() => getDesignBasisFlow(), [getDesignBasisFlow])
  const selectedCount = getSelectedCaseCount()
  const [showASMEWarning, setShowASMEWarning] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  useScrollPosition()

  // Validate vessel properties (vesselName is optional)
  const vesselPropertiesValid = useMemo(() => {
    const isSphere = vesselData.vesselOrientation === 'sphere'
    
    // Required fields
    if (!vesselData.vesselTag || vesselData.vesselTag.trim() === '') return false
    if (!vesselData.vesselDiameter || vesselData.vesselDiameter <= 0) return false
    if (!isSphere && (!vesselData.straightSideHeight || vesselData.straightSideHeight <= 0)) return false
    if (!isSphere && (!vesselData.headType || vesselData.headType.trim() === '')) return false
    if (!vesselData.vesselDesignMawp || vesselData.vesselDesignMawp <= 0) return false
    if (!vesselData.asmeSetPressure || vesselData.asmeSetPressure <= 0) return false
    if (!vesselData.vesselOrientation) return false
    
    return true
  }, [vesselData])

  // Get list of missing fields for error message
  const getMissingFields = (): string[] => {
    const missing: string[] = []
    const isSphere = vesselData.vesselOrientation === 'sphere'
    
    if (!vesselData.vesselTag || vesselData.vesselTag.trim() === '') {
      missing.push('Vessel Tag')
    }
    if (!vesselData.vesselDiameter || vesselData.vesselDiameter <= 0) {
      missing.push('Vessel Diameter')
    }
    if (!isSphere && (!vesselData.straightSideHeight || vesselData.straightSideHeight <= 0)) {
      missing.push('Straight Side Height')
    }
    if (!isSphere && (!vesselData.headType || vesselData.headType.trim() === '')) {
      missing.push('Head Type')
    }
    if (!vesselData.vesselDesignMawp || vesselData.vesselDesignMawp <= 0) {
      missing.push('Vessel Design MAWP')
    }
    if (!vesselData.asmeSetPressure || vesselData.asmeSetPressure <= 0) {
      missing.push('ASME Set Pressure')
    }
    if (!vesselData.vesselOrientation) {
      missing.push('Vessel Orientation')
    }
    
    return missing
  }

  const handleGenerateReport = () => {
    if (!vesselPropertiesValid) {
      const missingFields = getMissingFields()
      alert(`Please complete all required vessel properties before generating the report.\n\nMissing fields:\n${missingFields.join('\n')}`)
      return
    }
    
    // Check if set pressure exceeds MAWP
    const setPressureExceedsMAWP = vesselData.asmeSetPressure > vesselData.vesselDesignMawp && vesselData.vesselDesignMawp > 0
    
    if (setPressureExceedsMAWP) {
      setShowASMEWarning(true)
      return
    }
    
    generateReport()
  }

  const handleProceedWithReport = () => {
    setShowASMEWarning(false)
    generateReport()
  }
  
  // Check if a case has been started (has meaningful data, not just defaults)
  const caseHasStarted = (caseId: string): boolean => {
    if (typeof window === 'undefined') return false
    
    const flowData = localStorage.getItem(`${caseId}-flow-data`)
    if (!flowData) return false
    
    try {
      const parsed = JSON.parse(flowData)
      
      // Check if there's meaningful data based on case type
      if (caseId === 'external-fire') {
        return !!parsed.workingFluid && parsed.workingFluid !== ''
      } else if (caseId === 'control-valve-failure') {
        return parsed.totalCv > 0 || parsed.inletPressure > 0
      } else if (caseId === 'liquid-overfill') {
        return parsed.manualFlowRate > 0
      } else if (caseId === 'blocked-outlet') {
        return parsed.maxSourceFlowRate > 0 || parsed.maxSourcePressure > 0
      } else if (caseId === 'cooling-reflux-failure') {
        return parsed.incomingVaporRate > 0
      } else if (caseId === 'hydraulic-expansion') {
        return parsed.heatInputRate > 0 || parsed.trappedVolume > 0
      } else if (caseId === 'heat-exchanger-tube-rupture') {
        return parsed.highPressureSide > 0 || parsed.numberOfTubes > 1
      }
    } catch {
      return false
    }
    
    return false
  }

  // Get fluid/gas name for each case
  const getFluidName = (caseId: string): string => {
    if (typeof window === 'undefined') return ''
    
    if (caseId === 'external-fire') {
      const flowData = localStorage.getItem('external-fire-flow-data')
      if (flowData) {
        try {
          const parsed = JSON.parse(flowData)
          return parsed.workingFluid || ''
        } catch {
          return ''
        }
      }
    } else if (caseId === 'control-valve-failure') {
      const flowData = localStorage.getItem('control-valve-failure-flow-data')
      if (flowData) {
        try {
          const parsed = JSON.parse(flowData)
          return parsed.gasProperties?.name || ''
        } catch {
          return ''
        }
      }
    } else if (caseId === 'liquid-overfill') {
      const flowData = localStorage.getItem('liquid-overfill-flow-data')
      if (flowData) {
        try {
          const parsed = JSON.parse(flowData)
          return parsed.workingFluid || ''
        } catch {
          return ''
        }
      }
    } else if (caseId === 'blocked-outlet') {
      const flowData = localStorage.getItem('blocked-outlet-flow-data')
      if (flowData) {
        try {
          const parsed = JSON.parse(flowData)
          return parsed.workingFluid || ''
        } catch {
          return ''
        }
      }
    } else if (caseId === 'cooling-reflux-failure') {
      const flowData = localStorage.getItem('cooling-reflux-failure-flow-data')
      if (flowData) {
        try {
          const parsed = JSON.parse(flowData)
          return parsed.workingFluid || ''
        } catch {
          return ''
        }
      }
    } else if (caseId === 'hydraulic-expansion') {
      const flowData = localStorage.getItem('hydraulic-expansion-flow-data')
      if (flowData) {
        try {
          const parsed = JSON.parse(flowData)
          return parsed.workingFluid || ''
        } catch {
          return ''
        }
      }
    } else if (caseId === 'heat-exchanger-tube-rupture') {
      const flowData = localStorage.getItem('heat-exchanger-tube-rupture-flow-data')
      if (flowData) {
        try {
          const parsed = JSON.parse(flowData)
          return parsed.workingFluid || ''
        } catch {
          return ''
        }
      }
    }
    return ''
  }

  const isReady = !authLoading && vesselHydrated && casesHydrated

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />
        {/* Sticky Design Basis Flow Banner */}
        <div 
          className={`fixed sm:sticky top-[3.5rem] sm:top-[5.5rem] z-40 bg-gradient-to-r from-slate-600 to-slate-700 border-b-2 border-slate-800 shadow-lg overflow-hidden transition-all duration-500 ease-in-out w-full ${
            designBasisFlow 
              ? 'sm:max-h-20 max-h-32 opacity-100' 
              : 'max-h-0 opacity-0 border-b-0 pointer-events-none'
          }`}
        >


          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 transition-opacity duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <svg className="w-5 h-5 text-slate-100 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-slate-100 font-inter uppercase tracking-wide">Current Design Basis Flow:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl sm:text-3xl font-bold text-white font-inter">{designBasisFlow?.flow.toLocaleString() || '0'}</span>
                <span className="text-sm sm:text-lg text-white font-medium">lb/hr</span>
                <span className="text-xs sm:text-sm text-slate-100">from {designBasisFlow?.caseName || ''}</span>
                <div className="relative group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200 cursor-help" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                  </svg>
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                    Maximum flow across all calculated cases for hydraulic network modeling
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mobile-pt-0">
      {/* Hero Section */}
        <div className="mb-6 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Available Overpressure Scenarios
          </h2>
          <p className="text-base text-gray-900 mb-2">
            Calculate the required relieving rate for common overpressure scenarios in accordance with NFPA 30, API 521, and ASME VIII.
          </p>
        </div>

        {/* Main content: show either skeleton or real content to avoid jumbled transitions */}
        {!isReady ? (
          <>
            {/* Skeleton Vessel Bar */}
            <div className="mb-6">
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-5 h-5 rounded bg-gray-200" />
                  <div className="h-9 bg-gray-200 rounded-lg flex-1 max-w-md" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-9 bg-gray-200 rounded-lg" />
                  <div className="w-20 h-9 bg-gray-200 rounded-lg" />
                  <div className="w-20 h-9 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Skeleton Vessel Properties */}
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx}>
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                      <div className="h-10 w-full bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skeleton Cases Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-14 bg-gray-100 rounded-lg border border-dashed border-gray-200" />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
        {/* Vessel Bar */}
        <div className="mb-6">
          <VesselBar onLoginRequired={() => setShowAuthModal(true)} />
        </div>

        {/* Global Vessel Properties Section */}
        <div className="mb-6">
          <CollapsibleVesselProperties 
            defaultExpanded={true}
            showEditButton={false}
          />
        </div>

        {/* Calculation Cases */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Included in Calculation</span>
            </div>
            <div className="text-sm text-gray-500">
              {selectedCount} of 7 selected
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-4 font-inter">
            Select scenarios to include in your relief load summary. Only completed calculations will appear in the generated report.
          </p>
          
          <div className="space-y-2">
            {/* External Fire Case */}
            <CaseCard
              caseId="external-fire"
              title="External Fire"
              description="Relief from external fire exposure."
              href="/cases/external-fire"
              isSelected={selectedCases['external-fire']}
              caseResult={caseResults['external-fire']}
              fluidName={getFluidName('external-fire')}
              hasStarted={caseHasStarted('external-fire')}
              onToggle={() => toggleCase('external-fire')}
            />

            {/* Control Valve Failure Case */}
            <CaseCard
              caseId="control-valve-failure"
              title="Control Valve Failure"
              description="Gas control valve stuck-open scenario."
              href="/cases/control-valve-failure"
              isSelected={selectedCases['control-valve-failure']}
              caseResult={caseResults['control-valve-failure']}
              fluidName={getFluidName('control-valve-failure')}
              hasStarted={caseHasStarted('control-valve-failure')}
              onToggle={() => toggleCase('control-valve-failure')}
            />

            {/* Liquid Overfill Case */}
            <CaseCard
              caseId="liquid-overfill"
              title="Liquid Overfill"
              description="Vessel filling faster than liquid removal."
              href="/cases/liquid-overfill"
              isSelected={selectedCases['liquid-overfill']}
              caseResult={caseResults['liquid-overfill']}
              fluidName={getFluidName('liquid-overfill')}
              hasStarted={caseHasStarted('liquid-overfill')}
              onToggle={() => toggleCase('liquid-overfill')}
            />

            {/* Blocked Outlet Case */}
            <CaseCard
              caseId="blocked-outlet"
              title="Blocked Outlet (Closed Outlet)"
              description="Inadvertent closure of outlet valve during operation."
              href="/cases/blocked-outlet"
              isSelected={selectedCases['blocked-outlet']}
              caseResult={caseResults['blocked-outlet']}
              fluidName={getFluidName('blocked-outlet')}
              hasStarted={caseHasStarted('blocked-outlet')}
              onToggle={() => toggleCase('blocked-outlet')}
            />

            {/* Cooling/Reflux Failure Case */}
            <CaseCard
              caseId="cooling-reflux-failure"
              title="Cooling/Reflux Failure (Loss of Condenser)"
              description="Failure of cooling or condensation systems."
              href="/cases/cooling-reflux-failure"
              isSelected={selectedCases['cooling-reflux-failure']}
              caseResult={caseResults['cooling-reflux-failure']}
              fluidName={getFluidName('cooling-reflux-failure')}
              hasStarted={caseHasStarted('cooling-reflux-failure')}
              onToggle={() => toggleCase('cooling-reflux-failure')}
            />

            {/* Hydraulic Expansion Case */}
            <CaseCard
              caseId="hydraulic-expansion"
              title="Hydraulic Expansion (Thermal Expansion)"
              description="Blocked-in liquid heated by heat tracing, exchangers, or solar radiation."
              href="/cases/hydraulic-expansion"
              isSelected={selectedCases['hydraulic-expansion']}
              caseResult={caseResults['hydraulic-expansion']}
              fluidName={getFluidName('hydraulic-expansion')}
              hasStarted={caseHasStarted('hydraulic-expansion')}
              onToggle={() => toggleCase('hydraulic-expansion')}
            />

            {/* Heat Exchanger Tube Rupture Case */}
            <CaseCard
              caseId="heat-exchanger-tube-rupture"
              title="Heat Exchanger Tube Rupture"
              description="Internal tube failure allowing high-pressure fluid into low-pressure side."
              href="/cases/heat-exchanger-tube-rupture"
              isSelected={selectedCases['heat-exchanger-tube-rupture']}
              caseResult={caseResults['heat-exchanger-tube-rupture']}
              fluidName={getFluidName('heat-exchanger-tube-rupture') ? `(${getFluidName('heat-exchanger-tube-rupture')})` : undefined}
              hasStarted={caseHasStarted('heat-exchanger-tube-rupture')}
              onToggle={() => toggleCase('heat-exchanger-tube-rupture')}
            />

          </div>
        </div>

        {/* Next Steps */}
        <div 
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            selectedCount > 0 
              ? 'max-h-96 opacity-100 mt-6' 
              : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h3>
            <p className="text-gray-600 mb-6">
              {hasCalculatedResults() 
                ? 'Complete calculations for all selected cases, then import the Design Basis Flow into your preferred process or hydraulic simulation software (e.g., FluidFlow, Aspen HYSYS, etc.) for detailed modeling.'
                : 'Calculate relief requirements for your selected cases. The highest flow will become your Design Basis Flow.'
              }
            </p>
            
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={handleGenerateReport}
                disabled={isGenerating || !hasCalculatedResults() || !vesselPropertiesValid}
                className={`
                  px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 
                  flex items-center space-x-2
                  ${isGenerating
                    ? 'bg-gray-400 cursor-wait opacity-60'
                    : !hasCalculatedResults() || !vesselPropertiesValid
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transform hover:-translate-y-0.5 text-white cursor-pointer'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-white">Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Generate Report</span>
                  </>
                )}
              </button>
              {!vesselPropertiesValid && !isGenerating && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    Fill out all vessel properties before generating a report
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Built for engineers, by engineers. Following NFPA 30, API 521, and ASME VIII standards.</p>
        </div>
    </main>
      </div>
      
      {/* ASME Warning Modal */}
      <ASMEWarningModal
        isOpen={showASMEWarning}
        onClose={() => setShowASMEWarning(false)}
        onProceed={handleProceedWithReport}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </PageTransition>
  )
}
