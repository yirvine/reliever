'use client'

import React, { useState, useEffect } from 'react'
import VesselProperties from '../../components/VesselProperties'
import CasePressureSettings from '../../components/CasePressureSettings'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'

interface FlowData {
  nitrogenPressure: number
  reliefTemperature: number
  compressibilityFactor: number
}

interface CasePressureData {
  maxAllowedVentingPressure: number
  maxAllowableBackpressure: number
  maxAllowedVentingPressurePercent: number
}

export default function NitrogenFailureCase() {
  const { vesselData, updateVesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const isSelected = selectedCases['nitrogen-control']

  const [flowData, setFlowData] = useState<FlowData>({
    nitrogenPressure: 0,
    reliefTemperature: 0,
    compressibilityFactor: 1.0
  })

  const [pressureData, setPressureData] = useState<CasePressureData>({
    maxAllowedVentingPressure: 0,
    maxAllowableBackpressure: 0,
    maxAllowedVentingPressurePercent: 110 // Default for nitrogen case
  })

  // Load data from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const savedFlowData = localStorage.getItem('nitrogen-failure-flow-data')
      if (savedFlowData) {
        setFlowData(JSON.parse(savedFlowData))
      }
    } catch {
      // If localStorage fails, use default values
    }
  }, [])

  const handleFlowDataChange = (field: keyof FlowData, value: string | number | boolean) => {
    const newData = { ...flowData, [field]: value }
    setFlowData(newData)
    
    // Save to localStorage
    try {
      localStorage.setItem('nitrogen-failure-flow-data', JSON.stringify(newData))
    } catch {
      // If localStorage fails, continue without saving
    }
  }

  const handlePressureDataChange = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate preview values
  const calculatePreview = () => {
    try {
      // Check if we have all required data
      if (!flowData.nitrogenPressure || !flowData.reliefTemperature || !vesselData.vesselDiameter) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, reason: 'Missing required data' }
      }

      // Simplified nitrogen failure calculation (placeholder formulas)
      const vesselVolume = Math.PI * Math.pow(vesselData.vesselDiameter / 24, 2) * (vesselData.straightSideHeight / 12) // Convert to cubic feet
      const calculatedRelievingFlow = Math.round((flowData.nitrogenPressure * vesselVolume * 520) / (flowData.reliefTemperature + 460) * flowData.compressibilityFactor)
      const asmeVIIIDesignFlow = Math.round(calculatedRelievingFlow * 1.11) // Safety factor
      const equivalentAirFlow = Math.round(calculatedRelievingFlow * 8.5) // Conversion factor

      return { calculatedRelievingFlow, asmeVIIIDesignFlow, equivalentAirFlow, reason: null }
    } catch {
      return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, reason: 'Calculation error' }
    }
  }

  const previewValues = calculatePreview()

  // Auto-update case results when calculations change
  useEffect(() => {
    if (previewValues.calculatedRelievingFlow && previewValues.calculatedRelievingFlow > 0) {
      updateCaseResult('nitrogen-control', {
        asmeVIIIDesignFlow: previewValues.asmeVIIIDesignFlow!,
        isCalculated: true
      })
    }
  }, [previewValues.calculatedRelievingFlow, previewValues.asmeVIIIDesignFlow, updateCaseResult])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Case 2 - Nitrogen Control Failure</h1>
              <p className="text-gray-600">
                Calculate relief requirements for nitrogen control system failure scenarios.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Include Case</span>
              <div className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                ${isSelected ? 'bg-green-600' : 'bg-gray-200'}
              `}
              onClick={() => toggleCase('nitrogen-control')}
              >
                <span className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${isSelected ? 'translate-x-5' : 'translate-x-0'}
                `} />
              </div>
            </div>
          </div>
        </div>

        <div className={`space-y-8 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
          {/* Vessel Properties - Shared across all cases */}
          <VesselProperties 
            vesselData={vesselData} 
            onChange={updateVesselData}
          />

          {/* Case-Specific Pressure Settings */}
          <CasePressureSettings
            pressureData={pressureData}
            onChange={handlePressureDataChange}
            caseName="Nitrogen Control Failure"
            isAutoCalculated={false}
            vesselMawp={vesselData.vesselDesignMawp}
          />

          {/* Flow Calculations - Nitrogen specific */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
            <p className="text-sm text-gray-600 mb-4">
              User inputs only - other values are calculated automatically
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nitrogen Pressure (psig)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={flowData.nitrogenPressure || ''}
                  onChange={(e) => handleFlowDataChange('nitrogenPressure', parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., 150"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Maximum nitrogen supply pressure</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relief Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={flowData.reliefTemperature || ''}
                  onChange={(e) => handleFlowDataChange('reliefTemperature', parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., 100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Expected relief temperature</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compressibility Factor (Z)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={flowData.compressibilityFactor || ''}
                  onChange={(e) => handleFlowDataChange('compressibilityFactor', parseFloat(e.target.value) || 1.0)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="1.0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Gas compressibility factor</p>
              </div>

              {/* Empty 4th column for now */}
              <div></div>
            </div>

            {/* Calculated values preview (read-only) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Calculated Relieving Flow
                    </label>
                    <div className="group relative">
                      <svg 
                        className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-max select-text">
                        Based on nitrogen pressure and vessel volume
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-medium text-gray-700">
                      {previewValues.calculatedRelievingFlow ? `${previewValues.calculatedRelievingFlow.toLocaleString()} lb/hr` : '—'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      ASME VIII Design Flow
                    </label>
                    <div className="group relative">
                      <svg 
                        className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-max select-text">
                        Calculated Relieving Flow ÷ 0.9
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-bold text-gray-700">
                      {previewValues.asmeVIIIDesignFlow ? `${previewValues.asmeVIIIDesignFlow.toLocaleString()} lb/hr` : '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Equivalent Air Flow
                    </label>
                    <div className="group relative">
                      <svg 
                        className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-max select-text">
                        Nitrogen flow converted to equivalent air flow
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-medium text-gray-700">
                      {previewValues.equivalentAirFlow ? `${previewValues.equivalentAirFlow.toLocaleString()} SCFH` : '—'}
                    </div>
                  </div>
                </div>

                {/* 4th column - Design Basis Status */}
                <div className="flex items-end">
                  <div className="text-base text-gray-600 p-3">
                    {(() => {
                      const designBasisFlow = getDesignBasisFlow()
                      const isCurrentDesignBasis = designBasisFlow && 
                        designBasisFlow.caseName === 'Nitrogen Control Failure' && 
                        previewValues.asmeVIIIDesignFlow && 
                        previewValues.asmeVIIIDesignFlow > 0
                      
                      if (isCurrentDesignBasis) {
                        return (
                          <div className="text-gray-900">
                            This <strong>is</strong> the current Design Basis Flow
                          </div>
                        )
                      } else if (previewValues.asmeVIIIDesignFlow && previewValues.asmeVIIIDesignFlow > 0) {
                        return (
                          <div className="text-gray-600">
                            This <strong>is not</strong> the current Design Basis Flow
                          </div>
                        )
                      } else {
                        return (
                          <div className="text-gray-400">
                            Complete calculations to determine status
                          </div>
                        )
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        </main>
      </div>
    </PageTransition>
  )
}
