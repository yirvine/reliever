'use client'

import React, { useState, useEffect } from 'react'
import VesselProperties from '../../components/VesselProperties'
import CasePressureSettings from '../../components/CasePressureSettings'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'
import { calculateHeatInput } from '../../../../lib/database'

interface FlowData {
  applicableFireCode: string
  heatOfVaporization: number
  hasAdequateDrainageFirefighting?: boolean // For API 521 only
}

interface CasePressureData {
  maxAllowedVentingPressure: number
  maxAllowableBackpressure: number
  maxAllowedVentingPressurePercent: number
}

export default function ExternalFireCase() {
  const { vesselData, updateVesselData, calculateFireExposedArea } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const isSelected = selectedCases['external-fire']

  const [flowData, setFlowData] = useState<FlowData>({
    applicableFireCode: 'NFPA 30',
    heatOfVaporization: 0,
    hasAdequateDrainageFirefighting: undefined
  })

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem('external-fire-flow-data')
    if (saved) {
      try {
        const parsedData = JSON.parse(saved)
        setFlowData(parsedData)
      } catch {
        // If parsing fails, keep defaults
      }
    }
  }, [])

  const [pressureData, setPressureData] = useState<CasePressureData>({
    maxAllowedVentingPressure: 0,
    maxAllowableBackpressure: 0,
    maxAllowedVentingPressurePercent: 0
  })


  const handleFlowDataChange = (field: keyof FlowData, value: string | number | boolean) => {
    const newData = { ...flowData, [field]: value }
    setFlowData(newData)
    
    // Save to localStorage (client-side only)
    localStorage.setItem('external-fire-flow-data', JSON.stringify(newData))
  }

  // Calculate preview values in real-time
  const calculatePreview = () => {
    try {
      // Check if we have all required data
      if (!flowData.heatOfVaporization || flowData.heatOfVaporization === 0) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, reason: 'No heat of vaporization' }
      }

      if (!vesselData.vesselDiameter || !vesselData.straightSideHeight || !vesselData.headType) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, reason: 'Missing vessel data' }
      }

      const fireExposedArea = calculateFireExposedArea(flowData.applicableFireCode)
      
      if (!fireExposedArea || fireExposedArea <= 0) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, reason: 'Invalid fire exposed area' }
      }
      
      // For API 521, require drainage/firefighting selection
      if (flowData.applicableFireCode === 'API 521' && flowData.hasAdequateDrainageFirefighting === undefined) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, reason: 'API 521 requires drainage selection' }
      }

      const heatInputResult = calculateHeatInput(
        flowData.applicableFireCode as 'NFPA 30' | 'API 521',
        fireExposedArea,
        flowData.hasAdequateDrainageFirefighting
      )

      if (!heatInputResult || !heatInputResult.heatInput) {
        // Check if it's because NFPA area is too small
        if (flowData.applicableFireCode === 'NFPA 30' && fireExposedArea < 20) {
          return { 
            calculatedRelievingFlow: null, 
            asmeVIIIDesignFlow: null, 
            equivalentAirFlow: null, 
            reason: `NFPA 30 requires area ≥ 20 sq ft (current: ${fireExposedArea.toFixed(1)} sq ft)` 
          }
        }
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, reason: 'Heat input calculation failed' }
      }

      const { heatInput } = heatInputResult
      const calculatedRelievingFlow = Math.round(heatInput / flowData.heatOfVaporization)
      const asmeVIIIDesignFlow = Math.round(calculatedRelievingFlow * 1.11)
      const equivalentAirFlow = Math.round(calculatedRelievingFlow * 10.28)

      return { calculatedRelievingFlow, asmeVIIIDesignFlow, equivalentAirFlow, reason: null }
    } catch {
      return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, reason: 'Calculation error' }
    }
  }

  const previewValues = calculatePreview()

  const handleFluidPropertiesFound = (heatOfVaporization: number) => {
    const newData = { ...flowData, heatOfVaporization }
    setFlowData(newData)
    
    // Save to localStorage (client-side only)
    localStorage.setItem('external-fire-flow-data', JSON.stringify(newData))
  }

  const handlePressureDataChange = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Auto-update case results when calculations change
  React.useEffect(() => {
    if (previewValues.calculatedRelievingFlow && previewValues.calculatedRelievingFlow > 0) {
      updateCaseResult('external-fire', {
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Case 1 - External Fire</h1>
              <p className="text-gray-600">
                Calculate relief requirements for external fire exposure following the relevant code guidelines.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Include Case</span>
              <div className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                ${isSelected ? 'bg-green-600' : 'bg-gray-200'}
              `}
              onClick={() => toggleCase('external-fire')}
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
            onFluidPropertiesFound={handleFluidPropertiesFound}
          />

          {/* Case-Specific Pressure Settings */}
          <CasePressureSettings
            pressureData={pressureData}
            onChange={handlePressureDataChange}
            caseName="External Fire"
            isAutoCalculated={true}
            vesselMawp={vesselData.vesselDesignMawp}
            fireExposedArea={calculateFireExposedArea(flowData.applicableFireCode)}
          />

          {/* Flow Calculations - Only user inputs (orange fields from Excel) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
            <p className="text-sm text-gray-600 mb-4">
              User inputs only - other values are calculated automatically
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Applicable Code for Heat Input Calc.
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
                      If the working fluid in the vessel is flammable, NFPA 30 should be used.
                    </div>
                  </div>
                </div>
                <select
                  value={flowData.applicableFireCode}
                  onChange={(e) => {
                    const newCode = e.target.value
                    handleFlowDataChange('applicableFireCode', newCode)
                    
                    // Smart defaulting for API 521
                    if (newCode === 'API 521' && flowData.hasAdequateDrainageFirefighting === undefined) {
                      handleFlowDataChange('hasAdequateDrainageFirefighting', false) // Default to "No"
                    }
                  }}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="NFPA 30">NFPA 30</option>
                  <option value="API 521">API 521</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Affects fire exposed area calculation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heat of Vaporization (Btu/lb)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={flowData.heatOfVaporization || ''}
                  disabled
                  className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-gray-700 font-medium"
                  title="Auto-filled from selected working fluid"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-filled from working fluid selection</p>
              </div>

              {/* API 521 Specific Question - Third Column */}
              {flowData.applicableFireCode === 'API 521' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-xs font-medium text-gray-700">
                      Adequate drainage & firefighting equipment?
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
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-max">
                        <div className="font-semibold mb-2">API 521 Heat Input Formulas:</div>
                        <div className="mb-2">
                          <div className="font-medium">When adequate drainage and firefighting exist:</div>
                          <div>Q = 21,000 F (A<sub>wet</sub>)<sup>0.82</sup></div>
                        </div>
                        <div className="mb-2">
                          <div className="font-medium">When adequate drainage and firefighting do not exist:</div>
                          <div>Q = 34,500 F (A<sub>wet</sub>)<sup>0.82</sup></div>
                        </div>
                        <div className="text-xs mt-2 border-t border-gray-600 pt-2">
                          <div>Q = Total heat absorption (BTU/hr)</div>
                          <div>F = Environmental factor (default: 1)</div>
                          <div>A<sub>wet</sub> = Total wetted surface area (sq ft)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <select
                    value={flowData.hasAdequateDrainageFirefighting === undefined ? '' : flowData.hasAdequateDrainageFirefighting.toString()}
                    onChange={(e) => handleFlowDataChange('hasAdequateDrainageFirefighting', e.target.value === 'true')}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Affects heat input formula</p>
                </div>
              )}
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
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-96 select-text">
                        {previewValues.reason || (
                          flowData.applicableFireCode === 'NFPA 30' ? (
                            <div>
                              <div className="font-semibold mb-2">NFPA 30 (2018) Heat Input Formulas:</div>
                              <div className="mb-2">
                                <div className="grid grid-cols-2 gap-6 mb-1">
                                  <div className="font-medium">Area Range (sq ft)</div>
                                  <div className="font-medium">Heat Input Formula Q</div>
                                </div>
                                <div className="border-t border-gray-600 pt-1">
                                  <div className="grid grid-cols-2 gap-6 py-1">
                                    <div>20 - 200</div>
                                    <div>Q = 20,000A</div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6 py-1">
                                    <div>200 - 1,000</div>
                                    <div>Q = 199,300A<sup>0.566</sup></div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6 py-1">
                                    <div>1,000 - 2,800</div>
                                    <div>Q = 963,400A<sup>0.338</sup></div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6 py-1">
                                    <div>&gt; 2,800</div>
                                    <div>Q = 21,000A<sup>0.82</sup></div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs border-t border-gray-600 pt-2">
                                <div>Q = Heat Input (Btu/hr)</div>
                                <div>A = Fire Exposed Area (sq ft)</div>
                                <div>W = Q ÷ Heat of Vaporization</div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold mb-2">API 521 Heat Input Formulas:</div>
                              <div className="mb-2">
                                <div className="font-medium">When adequate drainage and firefighting exist:</div>
                                <div>Q = 21,000 F (A<sub>wet</sub>)<sup>0.82</sup></div>
                              </div>
                              <div className="mb-2">
                                <div className="font-medium">When adequate drainage and firefighting do not exist:</div>
                                <div>Q = 34,500 F (A<sub>wet</sub>)<sup>0.82</sup></div>
                              </div>
                              <div className="text-xs border-t border-gray-600 pt-2">
                                <div>Q = Total heat absorption (BTU/hr)</div>
                                <div>F = Environmental factor (default: 1)</div>
                                <div>A<sub>wet</sub> = Total wetted surface area (sq ft)</div>
                                <div>W = Q ÷ Heat of Vaporization</div>
                              </div>
                            </div>
                          )
                        )}
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
                        70.5 × ASME VIII Flow × Heat of Vaporization ÷ Fluid Molecular Weight
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
                        designBasisFlow.caseName === 'External Fire' && 
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