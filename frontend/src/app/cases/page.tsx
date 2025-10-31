'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import ToggleSwitch from '../components/ToggleSwitch'
import Header from '../components/Header'
import PageTransition from '../components/PageTransition'
import { useCase } from '../context/CaseContext'
import { useScrollPosition } from '../hooks/useScrollPosition'
import { useReportGenerator } from '../hooks/useReportGenerator'

export default function Calculator() {
  const { selectedCases, toggleCase, getDesignBasisFlow, getSelectedCaseCount, hasCalculatedResults } = useCase()
  const { generateReport, isGenerating } = useReportGenerator()
  const designBasisFlow = getDesignBasisFlow()
  const selectedCount = getSelectedCaseCount()
  
  const [showCard, setShowCard] = useState(!!designBasisFlow)
  const [animatingOut, setAnimatingOut] = useState(false)
  
  useScrollPosition()

  useEffect(() => {
    if (designBasisFlow && !showCard) {
      // Flow appeared, show card
      setShowCard(true)
      setAnimatingOut(false)
    } else if (!designBasisFlow && showCard) {
      // Flow disappeared, start exit animation
      setAnimatingOut(true)
      const timer = setTimeout(() => {
        setShowCard(false)
        setAnimatingOut(false)
      }, 300) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [designBasisFlow, showCard])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-inter">
            Relief sizing made simple.
          </h2>
          <p className="text-lg text-gray-600 max-w-8xl font-inter">
            Calculate the required relieving rate for common scenarios in accordance with NFPA 30, API 521, and ASME VIII.
            Use this rate in simulation software (e.g. FluidFlow) to size the appropriate relief valve or burst disc,
            then import the final device selection here for reporting.
          </p>
        </div>




        {/* Design Basis Flow Summary - Only when calculated */}
        {showCard && (
          <div className={`bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6 ${
            animatingOut ? 'animate-out' : 'animate-in'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-slate-700 font-inter mr-2">Current Design Basis Flow</h3>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Maximum flow across all calculated cases
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">
                  <span className="text-2xl font-bold font-inter">{designBasisFlow?.flow.toLocaleString()}</span> lb/hr
                  <span className="text-sm ml-2">from {designBasisFlow?.caseName}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This is the maximum flow across all calculated cases and should be used for FluidFlow modeling.
                </p>
              </div>
              <div className="text-gray-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Calculation Cases */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 font-inter">Available Calculation Cases</h3>
            <div className="text-sm text-gray-500">
              {selectedCount} of 4 cases selected
            </div>
          </div>
          
          <div className="grid gap-4">
            {/* External Fire Case */}
            <div className={`
              p-6 border rounded-lg transition-all duration-200 relative
              ${selectedCases['external-fire'] 
                ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md' 
                : 'border-gray-200 bg-gray-50'
              }
            `}>
              <div className="absolute top-4 right-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Include</span>
                  <ToggleSwitch
                    enabled={selectedCases['external-fire']}
                    onChange={() => toggleCase('external-fire')}
                    size="sm"
                  />
                </div>
              </div>
              
              {selectedCases['external-fire'] ? (
                <Link href="/cases/external-fire" className="block">
                  <div className="flex items-center justify-between pr-16">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Case 1 - External Fire
                      </h4>
                      <p className="text-gray-600">
                        Calculate relief requirements for external fire exposure.
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        Available
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center justify-between pr-16">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-500 mb-2">
                      Case 1 - External Fire
                    </h4>
                    <p className="text-gray-500">
                      Calculate relief requirements for external fire exposure.
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                      Not Selected
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Nitrogen Control Case */}
            <div className={`
              p-6 border rounded-lg transition-all duration-200 relative
              ${selectedCases['nitrogen-control'] 
                ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md' 
                : 'border-gray-200 bg-gray-50'
              }
            `}>
              <div className="absolute top-4 right-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Include</span>
                  <ToggleSwitch
                    enabled={selectedCases['nitrogen-control']}
                    onChange={() => toggleCase('nitrogen-control')}
                    size="sm"
                  />
                </div>
              </div>
              
              {selectedCases['nitrogen-control'] ? (
                <Link href="/cases/nitrogen-failure" className="block">
                  <div className="flex items-center justify-between pr-16">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Case 2 - Nitrogen Control Failure
                      </h4>
                      <p className="text-gray-600">
                        Calculate relief requirements for nitrogen control system failure.
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        Available
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center justify-between pr-16">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-500 mb-2">
                      Case 2 - Nitrogen Control Failure
                    </h4>
                    <p className="text-gray-500">
                      Calculate relief requirements for nitrogen control system failure.
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                      Not Selected
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Liquid Overfill Case */}
            <div className={`
              p-6 border rounded-lg transition-all duration-200 relative
              ${selectedCases['liquid-overfill'] 
                ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md' 
                : 'border-gray-200 bg-gray-50'
              }
            `}>
              <div className="absolute top-4 right-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Include</span>
                  <ToggleSwitch
                    enabled={selectedCases['liquid-overfill']}
                    onChange={() => toggleCase('liquid-overfill')}
                    size="sm"
                  />
                </div>
              </div>
              
              {selectedCases['liquid-overfill'] ? (
                <Link href="/cases/liquid-overfill" className="block">
                  <div className="flex items-center justify-between pr-16">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Case 3 - Liquid Overfill
                      </h4>
                      <p className="text-gray-600">
                        Calculate relief requirements for liquid overfill scenarios where vessel receives liquid faster than it can be removed.
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        Available
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center justify-between pr-16">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-500 mb-2">
                      Case 3 - Liquid Overfill
                    </h4>
                    <p className="text-gray-500">
                      Calculate relief requirements for liquid overfill scenarios where vessel receives liquid faster than it can be removed.
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                      Not Selected
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Cases */}
            <div className={`
              p-6 border rounded-lg transition-all duration-200 relative
              ${selectedCases['additional-cases'] 
                ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md' 
                : 'border-gray-200 bg-gray-50'
              }
            `}>
              <div className="absolute top-4 right-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Include</span>
                  <ToggleSwitch
                    enabled={selectedCases['additional-cases']}
                    onChange={() => toggleCase('additional-cases')}
                    size="sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pr-16">
                <div>
                  <h4 className={`text-lg font-semibold mb-2 ${selectedCases['additional-cases'] ? 'text-gray-900' : 'text-gray-500'}`}>
                    Case 4 - Additional Cases
                  </h4>
                  <p className={selectedCases['additional-cases'] ? 'text-gray-600' : 'text-gray-500'}>
                    Split Exchanger Tube, Blocked Discharge, Heating/Cooling Control Failure, and more.
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    selectedCases['additional-cases'] 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedCases['additional-cases'] ? 'Coming Soon' : 'Not Selected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {selectedCount > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h3>
            <p className="text-gray-600 mb-6">
              {hasCalculatedResults() 
                ? 'Complete calculations for all selected cases, then proceed to FluidFlow modeling using the Design Basis Flow.'
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
                  ${isGenerating || !hasCalculatedResults()
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transform hover:-translate-y-0.5 text-white'
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
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Built for engineers, by engineers. Following NFPA 30, API 521, and ASME VIII standards.</p>
        </div>
    </main>
      </div>
    </PageTransition>
  )
}
