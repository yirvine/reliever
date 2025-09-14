'use client'

import Link from 'next/link'
import Image from 'next/image'
import ToggleSwitch from './components/ToggleSwitch'
import { useCase } from './context/CaseContext'

export default function Home() {
  const { selectedCases, toggleCase, getDesignBasisFlow, getSelectedCaseCount, hasCalculatedResults } = useCase()
  const designBasisFlow = getDesignBasisFlow()
  const selectedCount = getSelectedCaseCount()
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Image 
              src="/ReliefGuardBannerTransparent.png" 
              alt="ReliefGuard" 
              width={200} 
              height={50} 
              className="h-8 w-auto"
            />
            <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">MVP</span>
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pressure Relief & Rupture Disc Sizing
            </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Modern web application for sizing pressure relief valves and rupture discs following 
            NFPA 30, API 521, and ASME VIII guidelines. Fast, accurate, and professional.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mr-3">Accurate Calculations</h3>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600">Validated formulas based on industry standards with results tested against proven methods.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mr-3">Fast & Modern</h3>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600">Clean web interface that&apos;s fast and responsive, replacing slow Excel workbooks.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mr-3">Professional Reports</h3>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600">Generate clean, professional PDF reports with calculations and results.</p>
          </div>
        </div>

        {/* Design Basis Flow Summary */}
        {designBasisFlow && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Design Basis Flow</h3>
                <p className="text-blue-700">
                  <span className="text-2xl font-bold">{designBasisFlow.flow.toLocaleString()}</span> lb/hr
                  <span className="text-sm ml-2">from {designBasisFlow.caseName}</span>
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  This is the maximum flow across all calculated cases and should be used for FluidFlow modeling.
                </p>
              </div>
              <div className="text-blue-500">
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
            <h3 className="text-2xl font-bold text-gray-900">Available Calculation Cases</h3>
            <div className="text-sm text-gray-500">
              {selectedCount} of 3 cases selected
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
                        Calculate relief requirements for external fire exposure following relevant code guidelines.
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
                      Calculate relief requirements for external fire exposure following relevant code guidelines.
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
              
              <div className="flex items-center justify-between pr-16">
                <div>
                  <h4 className={`text-lg font-semibold mb-2 ${selectedCases['nitrogen-control'] ? 'text-gray-900' : 'text-gray-500'}`}>
                    Case 2 - Nitrogen Control Failure
                  </h4>
                  <p className={selectedCases['nitrogen-control'] ? 'text-gray-600' : 'text-gray-500'}>
                    Calculate relief requirements for nitrogen control system failure.
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    selectedCases['nitrogen-control'] 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedCases['nitrogen-control'] ? 'Coming Soon' : 'Not Selected'}
                  </span>
                </div>
              </div>
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
                    Additional Cases
                  </h4>
                  <p className={selectedCases['additional-cases'] ? 'text-gray-600' : 'text-gray-500'}>
                    Split Exchanger Tube, Liquid Overfill, Heating/Cooling Control Failure, and more.
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
            
            <div className="flex space-x-4">
              {selectedCases['external-fire'] && (
                <Link 
                  href="/cases/external-fire"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Calculate External Fire
                </Link>
              )}
              
              {designBasisFlow && (
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                  Proceed to FluidFlow Modeling
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Built for engineers, by engineers. Following NFPA 30, API 521, and ASME VIII standards.</p>
        </div>
      </main>
    </div>
  )
}
