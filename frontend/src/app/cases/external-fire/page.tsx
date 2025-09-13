'use client'

import { useState } from 'react'
import Link from 'next/link'
import VesselProperties from '../../components/VesselProperties'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'

interface FlowData {
  applicableFireCode: string
  approximateRelievingTemp: number
  heatOfVaporization: number
}

export default function ExternalFireCase() {
  const { vesselData, updateVesselData, calculateFireExposedArea } = useVessel()
  const { updateCaseResult } = useCase()

  const [flowData, setFlowData] = useState<FlowData>({
    applicableFireCode: 'NFPA 30',
    approximateRelievingTemp: 400,
    heatOfVaporization: 0
  })

  const [results, setResults] = useState<{
    calculatedRelievingFlow: number
    asmeVIIIDesignRelievingFlow: number
    equivalentAirFlow: number
    isDesignBasisFlow: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFlowDataChange = (field: keyof FlowData, value: string | number) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // For now, just simulate a calculation with mock data
    setTimeout(() => {
      const mockResults = {
        calculatedRelievingFlow: 2279,
        asmeVIIIDesignRelievingFlow: 2533,
        equivalentAirFlow: 23428,
        isDesignBasisFlow: true
      }
      
      setResults(mockResults)
      
      // Update the case context with results
      updateCaseResult('external-fire', {
        asmeVIIIDesignFlow: mockResults.asmeVIIIDesignRelievingFlow,
        isCalculated: true
      })
      
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                Reliever
              </Link>
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">MVP</span>
              <span className="ml-4 text-lg text-gray-600">/ Case 1 - External Fire</span>
            </div>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">External Fire Case</h1>
          <p className="text-gray-600">
            Calculate relief requirements for external fire exposure following NFPA 30 guidelines.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vessel Properties - Shared across all cases */}
          <VesselProperties 
            vesselData={vesselData} 
            onChange={updateVesselData}
            fireExposedArea={calculateFireExposedArea(flowData.applicableFireCode)}
          />

          {/* Flow Calculations - Only user inputs (orange fields from Excel) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
            <p className="text-sm text-gray-600 mb-4">
              User inputs only - other values are calculated automatically
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Fire Code for Heat Input Calc.
                </label>
                <select
                  value={flowData.applicableFireCode}
                  onChange={(e) => handleFlowDataChange('applicableFireCode', e.target.value)}
                  className="w-full px-3 py-2 border border-orange-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-orange-50"
                >
                  <option value="NFPA 30">NFPA 30</option>
                  <option value="API 521">API 521</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Affects fire exposed area calculation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approximate Relieving Temperature (°F)
                </label>
                <input
                  type="number"
                  value={flowData.approximateRelievingTemp || ''}
                  onChange={(e) => handleFlowDataChange('approximateRelievingTemp', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-orange-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-orange-50"
                  placeholder="e.g., 400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heat of Vaporization (Btu/lb)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={flowData.heatOfVaporization || ''}
                  onChange={(e) => handleFlowDataChange('heatOfVaporization', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-orange-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-orange-50"
                  placeholder="e.g., 224"
                  required
                />
              </div>
            </div>

            {/* Calculated values preview (read-only) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Calculated Values (Preview)</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-xs text-gray-500">Calculated Relieving Flow</div>
                  <div className="font-medium text-gray-700">2,279 lb/hr</div>
                </div>
                <div className="bg-blue-50 p-3 rounded border">
                  <div className="text-xs text-gray-500">ASME VIII Design Flow</div>
                  <div className="font-medium text-blue-700">2,533 lb/hr</div>
                </div>
                <div className="bg-green-50 p-3 rounded border">
                  <div className="text-xs text-gray-500">Equivalent Air Flow</div>
                  <div className="font-medium text-green-700">23,428 SCFH</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </>
              ) : (
                'Calculate Relief Requirements'
              )}
            </button>
          </div>
        </form>

        {/* Results */}
        {results && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Calculation Results</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Calculated Relieving Flow</div>
                <div className="text-2xl font-bold text-gray-900">{results.calculatedRelievingFlow.toLocaleString()}</div>
                <div className="text-sm text-gray-500">lb/hr</div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">ASME VIII Design Relieving Flow</div>
                <div className="text-2xl font-bold text-blue-900">{results.asmeVIIIDesignRelievingFlow.toLocaleString()}</div>
                <div className="text-sm text-gray-500">lb/hr</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Equivalent Air Flow</div>
                <div className="text-2xl font-bold text-green-900">{results.equivalentAirFlow.toLocaleString()}</div>
                <div className="text-sm text-gray-500">SCFH</div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Design Basis Flow</div>
                <div className="text-2xl font-bold text-purple-900">
                  {results.isDesignBasisFlow ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-gray-500">Status</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                The model should input the ASME VIII Design Relieving Flow into the &apos;design flow&apos; field on FluidFlow 
                (remember to ensure units in FluidFlow are correct).
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                Generate PDF Report
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}