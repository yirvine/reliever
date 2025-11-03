'use client'

import Link from 'next/link'
import Header from '../components/Header'
import PageTransition from '../components/PageTransition'
import CollapsibleVesselProperties from '../components/CollapsibleVesselProperties'
import { useCase } from '../context/CaseContext'
import { useVessel } from '../context/VesselContext'
import { useScrollPosition } from '../hooks/useScrollPosition'
import { useReportGenerator } from '../hooks/useReportGenerator'

export default function Calculator() {
  const { selectedCases, caseResults, toggleCase, getDesignBasisFlow, getSelectedCaseCount, hasCalculatedResults } = useCase()
  const { vesselData } = useVessel()
  const { generateReport, isGenerating } = useReportGenerator()
  const designBasisFlow = getDesignBasisFlow()
  const selectedCount = getSelectedCaseCount()
  
  useScrollPosition()
  
  // Get fluid/gas name for each case
  const getFluidName = (caseId: string): string => {
    if (caseId === 'external-fire') {
      return vesselData.workingFluid || ''
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
      return vesselData.workingFluid || ''
    }
    return ''
  }

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
          <h2 className="text-3xl font-bold text-gray-900 mb-3 font-inter">
            Available Relief Scenarios
          </h2>
          <p className="text-base text-gray-600 mb-2 font-inter">
            Calculate the required relieving rate for common scenarios in accordance with NFPA 30, API 521, and ASME VIII.
          </p>
          <p className="text-sm text-gray-500 font-inter">
            Select scenarios to include in your relief load summary. Only completed calculations will appear in the generated report.
          </p>
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
              {selectedCount} of 4 selected
            </div>
          </div>
          
          <div className="space-y-3">
            {/* External Fire Case */}
            <div className={`
              p-4 border rounded-lg transition-all duration-200
              ${selectedCases['external-fire'] 
                ? 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md' 
                : 'border-gray-200 bg-gray-50 opacity-60'
              }
            `}>
              <div className="flex items-center gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedCases['external-fire']}
                  onChange={() => toggleCase('external-fire')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                
                {/* Card Content */}
                <Link href="/cases/external-fire" className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className={`text-base font-semibold ${selectedCases['external-fire'] ? 'text-gray-900' : 'text-gray-500'}`}>
                          External Fire
                        </h4>
                        {selectedCases['external-fire'] && (
                          <>
                            {caseResults['external-fire'].isCalculated && caseResults['external-fire'].asmeVIIIDesignFlow ? (
                              <span className="text-sm font-medium text-blue-600">
                                {caseResults['external-fire'].asmeVIIIDesignFlow.toLocaleString()} lb/hr
                                {getFluidName('external-fire') && ` ${getFluidName('external-fire')}`}
                              </span>
                            ) : (
                              <span className="text-sm text-amber-600 font-medium">Incomplete</span>
                            )}
                          </>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${selectedCases['external-fire'] ? 'text-gray-600' : 'text-gray-400'}`}>
                        Relief from external fire exposure.
                      </p>
                    </div>
                    {selectedCases['external-fire'] && (
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </Link>
              </div>
            </div>

            {/* Control Valve Failure Case */}
            <div className={`
              p-4 border rounded-lg transition-all duration-200
              ${selectedCases['control-valve-failure'] 
                ? 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md' 
                : 'border-gray-200 bg-gray-50 opacity-60'
              }
            `}>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedCases['control-valve-failure']}
                  onChange={() => toggleCase('control-valve-failure')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                
                <Link href="/cases/control-valve-failure" className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className={`text-base font-semibold ${selectedCases['control-valve-failure'] ? 'text-gray-900' : 'text-gray-500'}`}>
                          Control Valve Failure
                        </h4>
                        {selectedCases['control-valve-failure'] && (
                          <>
                            {caseResults['control-valve-failure'].isCalculated && caseResults['control-valve-failure'].asmeVIIIDesignFlow ? (
                              <span className="text-sm font-medium text-blue-600">
                                {caseResults['control-valve-failure'].asmeVIIIDesignFlow.toLocaleString()} lb/hr
                                {getFluidName('control-valve-failure') && ` ${getFluidName('control-valve-failure')}`}
                              </span>
                            ) : (
                              <span className="text-sm text-amber-600 font-medium">Incomplete</span>
                            )}
                          </>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${selectedCases['control-valve-failure'] ? 'text-gray-600' : 'text-gray-400'}`}>
                        Gas control valve stuck-open scenario.
                      </p>
                    </div>
                    {selectedCases['control-valve-failure'] && (
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </Link>
              </div>
            </div>

            {/* Liquid Overfill Case */}
            <div className={`
              p-4 border rounded-lg transition-all duration-200
              ${selectedCases['liquid-overfill'] 
                ? 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md' 
                : 'border-gray-200 bg-gray-50 opacity-60'
              }
            `}>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedCases['liquid-overfill']}
                  onChange={() => toggleCase('liquid-overfill')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                
                <Link href="/cases/liquid-overfill" className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className={`text-base font-semibold ${selectedCases['liquid-overfill'] ? 'text-gray-900' : 'text-gray-500'}`}>
                          Liquid Overfill
                        </h4>
                        {selectedCases['liquid-overfill'] && (
                          <>
                            {caseResults['liquid-overfill'].isCalculated && caseResults['liquid-overfill'].asmeVIIIDesignFlow ? (
                              <span className="text-sm font-medium text-blue-600">
                                {caseResults['liquid-overfill'].asmeVIIIDesignFlow.toLocaleString()} lb/hr
                                {getFluidName('liquid-overfill') && ` ${getFluidName('liquid-overfill')}`}
                              </span>
                            ) : (
                              <span className="text-sm text-amber-600 font-medium">Incomplete</span>
                            )}
                          </>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${selectedCases['liquid-overfill'] ? 'text-gray-600' : 'text-gray-400'}`}>
                        Vessel filling faster than liquid removal.
                      </p>
                    </div>
                    {selectedCases['liquid-overfill'] && (
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </Link>
              </div>
            </div>

            {/* Additional Cases */}
            <div className={`
              p-4 border rounded-lg transition-all duration-200
              ${selectedCases['additional-cases'] 
                ? 'border-gray-300 bg-white' 
                : 'border-gray-200 bg-gray-50 opacity-60'
              }
            `}>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedCases['additional-cases']}
                  onChange={() => toggleCase('additional-cases')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className={`text-base font-semibold ${selectedCases['additional-cases'] ? 'text-gray-900' : 'text-gray-500'}`}>
                      Additional Cases
                    </h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${selectedCases['additional-cases'] ? 'text-gray-600' : 'text-gray-400'}`}>
                    Split Exchanger Tube, Blocked Discharge, Heating/Cooling Control Failure, and more.
                  </p>
                </div>
              </div>
            </div>
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
            
            <div className="flex justify-center">
              <button 
                onClick={generateReport}
                disabled={isGenerating || !hasCalculatedResults()}
                className={`
                  px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 
                  flex items-center space-x-2
                  ${isGenerating
                    ? 'bg-gray-400 cursor-wait opacity-60'
                    : !hasCalculatedResults()
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Built for engineers, by engineers. Following NFPA 30, API 521, and ASME VIII standards.</p>
        </div>
    </main>
      </div>
    </PageTransition>
  )
}
