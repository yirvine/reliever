'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import VesselProperties from '../../components/VesselProperties'
import CasePressureSettings from '../../components/CasePressureSettings'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import Tooltip from '../../components/Tooltip'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'
import { calculateHeatInput } from '../../../../lib/database'
import { useScrollPosition } from '../../hooks/useScrollPosition'

interface FlowData {
  applicableFireCode: string
  heatOfVaporization: number
  hasAdequateDrainageFirefighting?: boolean // For API 521 only
  nfpaReductionFactor?: number // For NFPA 30 protection (1.0 = none, 0.5, 0.4, 0.3)
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
  
  useScrollPosition()

  const [flowData, setFlowData] = useState<FlowData>({
    applicableFireCode: 'NFPA 30',
    heatOfVaporization: 0,
    hasAdequateDrainageFirefighting: undefined,
    nfpaReductionFactor: 1.0 // Default: no reduction
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

      let { heatInput } = heatInputResult
      
      // Apply NFPA 30 reduction factor if applicable
      if (flowData.applicableFireCode === 'NFPA 30' && flowData.nfpaReductionFactor && flowData.nfpaReductionFactor < 1.0) {
        heatInput = heatInput * flowData.nfpaReductionFactor
      }
      
      const calculatedRelievingFlow = Math.round(heatInput / flowData.heatOfVaporization)
      const asmeVIIIDesignFlow = Math.round(calculatedRelievingFlow / 0.9)
      const equivalentAirFlow = Math.round(calculatedRelievingFlow * 10.28)

      return { calculatedRelievingFlow, asmeVIIIDesignFlow, equivalentAirFlow, reason: null }
    } catch (error) {
      console.error('Calculation error:', error)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {/* Back to Cases Navigation */}
          <div className="mb-4">
            <Link 
              href="/cases" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Cases (progress is saved)
            </Link>
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Case 1 - External Fire</h1>
            <p className="text-gray-600 mb-4">
              Calculate relief requirements for external fire exposure following the relevant code guidelines.
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Include Case</span>
              <div className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                ${isSelected ? 'bg-green-600' : 'bg-gray-200'}
              `}
              onClick={() => toggleCase('external-fire')}
              >
                <span className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                  transition-all duration-500 ease-in-out
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
            disabled={!isSelected}
          />

          {/* Case-Specific Pressure Settings */}
          <CasePressureSettings
            pressureData={pressureData}
            onChange={handlePressureDataChange}
            caseName="External Fire"
            isAutoCalculated={true}
            vesselMawp={vesselData.vesselDesignMawp}
            fireExposedArea={calculateFireExposedArea(flowData.applicableFireCode)}
            mawpPercent={121}
            disabled={!isSelected}
          />

          {/* Flow Calculations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure calculation parameters - flow values are calculated automatically
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Applicable Code for Heat Input Calc.
                  </label>
                  <Tooltip 
                    className="w-80"
                    content={
                      <>
                        <div className="mb-2">
                          <strong className="text-blue-300">NFPA 30 (Chapter 22.7):</strong> Commonly used for flammable/combustible liquids. Originally developed for storage tanks but widely applied to process vessels.
                        </div>
                        <div className="mb-2">
                          <strong className="text-green-300">API 521:</strong> Comprehensive process industry standard for all equipment types. Includes fire exposure formulas with environmental factors.
                        </div>
                        <div className="text-xs italic border-t border-gray-600 pt-2 mt-2">
                          <strong>Tip:</strong> NFPA 30 is standard for flammable liquids. API 521 is used for non-flammable fluids or when specified by company standards.
                        </div>
                      </>
                    }
                  />
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
                  disabled={!isSelected}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                    !isSelected 
                      ? 'border-gray-200 bg-gray-50 text-gray-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="NFPA 30">NFPA 30</option>
                  <option value="API 521">API 521</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Affects heat input calculation method</p>
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

              {/* Fire Protection / Mitigation - Dynamic based on selected code */}
              <div className="lg:col-span-2">
                <div className="mb-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Fire Protection / Mitigation
                    </label>
                    <Tooltip 
                      className="w-80 break-words"
                      content={
                        flowData.applicableFireCode === 'NFPA 30' ? (
                          <>
                            <div className="font-semibold mb-2">NFPA 30 Section 22.7.3.5 - Reduction Factors:</div>
                            <div className="space-y-1 text-xs">
                              <div><strong>1.0 (100%):</strong> No fire protection measures</div>
                              <div><strong>0.5 (50%):</strong> Drainage provided (area {">"} 200 sq ft)</div>
                              <div><strong>0.4 (40%):</strong> Water spray system + drainage</div>
                              <div><strong>0.3 (30%):</strong> Automatic water spray OR insulation</div>
                            </div>
                            <div className="text-xs mt-2 border-t border-gray-600 pt-2 italic">
                              Reduction factors decrease the required emergency venting capacity based on fire protection measures.
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold mb-2">API 521 Heat Input Formulas:</div>
                            <div className="mb-2">
                              <div className="font-medium">With adequate drainage & firefighting:</div>
                              <div>Q = 21,000 F (A<sub>wet</sub>)<sup>0.82</sup></div>
                            </div>
                            <div className="mb-2">
                              <div className="font-medium">Without adequate drainage & firefighting:</div>
                              <div>Q = 34,500 F (A<sub>wet</sub>)<sup>0.82</sup></div>
                            </div>
                            <div className="text-xs mt-2 border-t border-gray-600 pt-2">
                              <div>Q = Total heat absorption (BTU/hr)</div>
                              <div>F = Environmental factor (default: 1)</div>
                              <div>A<sub>wet</sub> = Total wetted surface area (sq ft)</div>
                            </div>
                          </>
                        )
                      }
                    />
                  </div>
                </div>
                
                {/* NFPA 30: Reduction Factor Dropdown */}
                {flowData.applicableFireCode === 'NFPA 30' && (
                  <>
                    <select
                      value={flowData.nfpaReductionFactor || 1.0}
                      onChange={(e) => handleFlowDataChange('nfpaReductionFactor', parseFloat(e.target.value))}
                      disabled={!isSelected}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    >
                      <option value="1.0">No protection (Factor: 1.0)</option>
                      <option value="0.5">Drainage provided (Factor: 0.5)</option>
                      <option value="0.4">Water spray + drainage (Factor: 0.4)</option>
                      <option value="0.3">Auto water spray or insulation (Factor: 0.3)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Reduction factor per NFPA 30 Section 22.7.3.5</p>
                  </>
                )}

                {/* API 521: Yes/No Drainage & Firefighting */}
                {flowData.applicableFireCode === 'API 521' && (
                  <>
                    <select
                      value={flowData.hasAdequateDrainageFirefighting === undefined ? '' : flowData.hasAdequateDrainageFirefighting.toString()}
                      onChange={(e) => handleFlowDataChange('hasAdequateDrainageFirefighting', e.target.value === 'true')}
                      disabled={!isSelected}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes - Adequate drainage & firefighting</option>
                      <option value="false">No - Inadequate or no protection</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Affects heat input coefficient (21,000 vs 34,500)</p>
                  </>
                )}
              </div>
            </div>

            {/* NFPA 30 Applicability Warning */}
            {flowData.applicableFireCode === 'NFPA 30' && (
              <div className="mt-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">
                        <strong>NFPA 30 Applicability:</strong> These heat input calculations are from NFPA 30 Chapter 22.7, originally developed for storage tanks but commonly applied to all equipment containing flammable/combustible liquids (Class I, II, or IIIA with flash point {"<"} 200°F).
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Use NFPA 30 for flammable liquids. API 521 is used for non-flammable fluids or when specified by company/industry standards.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calculated values preview (read-only) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Calculated Relieving Flow
                    </label>
                    <Tooltip
                      className="max-w-[90vw] sm:max-w-md lg:w-96 break-words"
                      content={
                        previewValues.reason || (
                          flowData.applicableFireCode === 'NFPA 30' ? (
                            <div>
                              <div className="font-semibold mb-2">NFPA 30 Chapter 22.7 - Heat Input Formulas:</div>
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
                                <div>A = Wetted Surface Area (sq ft)</div>
                                <div>W = Q ÷ Heat of Vaporization (lb/hr)</div>
                                {flowData.nfpaReductionFactor && flowData.nfpaReductionFactor < 1.0 && (
                                  <div className="mt-1 text-yellow-300">
                                    Reduction factor {flowData.nfpaReductionFactor} applied per Section 22.7.3.5
                                  </div>
                                )}
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
                        )
                      }
                    />
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
                    <Tooltip
                      className="min-w-max"
                      content="Calculated Relieving Flow ÷ 0.9"
                    />
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
                    <Tooltip
                      className="min-w-max"
                      content="70.5 × ASME VIII Flow × Heat of Vaporization ÷ Fluid Molecular Weight"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-medium text-gray-700">
                      {previewValues.equivalentAirFlow ? `${previewValues.equivalentAirFlow.toLocaleString()} SCFH` : '—'}
                    </div>
                  </div>
                </div>

                {/* 4th column - Design Basis Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Design Basis Flow?
                    </label>
                  </div>
                  <div className={`p-3 rounded border ${
                    previewValues.asmeVIIIDesignFlow && previewValues.asmeVIIIDesignFlow > 0 ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className={`font-medium ${
                      previewValues.asmeVIIIDesignFlow && previewValues.asmeVIIIDesignFlow > 0 ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {(() => {
                        const designBasisFlow = getDesignBasisFlow()
                        const isCurrentDesignBasis = designBasisFlow && 
                          designBasisFlow.caseName === 'External Fire' && 
                          previewValues.asmeVIIIDesignFlow && 
                          previewValues.asmeVIIIDesignFlow > 0
                        
                        if (isCurrentDesignBasis) {
                          return 'Yes'
                        } else if (previewValues.asmeVIIIDesignFlow && previewValues.asmeVIIIDesignFlow > 0) {
                          return 'No'
                        } else {
                          return 'Not enough info'
                        }
                      })()} 
                    </div>
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