'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import VesselProperties from '../../components/VesselProperties'
import CasePressureSettings from '../../components/CasePressureSettings'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import Tooltip from '../../components/Tooltip'
import ScenarioAbout from '../../components/ScenarioAbout'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { CasePressureData, STORAGE_KEYS } from '../../types/case-types'
import { 
  calculateNitrogenFlow, 
  validateInputs, 
  type GasFlowInputs, 
  type GasProperties,
  COMMON_GASES,
  DEFAULT_GAS_PROPERTIES
} from './calculations'

export default function ControlValveFailureCase() {
  const { vesselData, updateVesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const isSelected = selectedCases['control-valve-failure']
  
  useScrollPosition()

  // Use custom hook for automatic localStorage sync
  const [flowData, setFlowData] = useLocalStorage<GasFlowInputs>(STORAGE_KEYS.CONTROL_VALVE_FLOW, {
    isManualFlowInput: false,
    manualFlowRate: 0,
    totalCv: 0,
    bypassCv: 0,
    considerBypass: false,
    inletPressure: 0,
    outletPressure: 0,
    temperatureF: 80,
    compressibilityZ: 1.0,
    xt: 0.7,
    gasProperties: DEFAULT_GAS_PROPERTIES,
    outletFlowCredit: 0,
    creditOutletFlow: false
  })
  
  const [selectedGas, setSelectedGas] = useState<string>('nitrogen')
  const [customGasProps, setCustomGasProps] = useState<GasProperties>(COMMON_GASES.custom)

  const [pressureData, setPressureData] = useLocalStorage<CasePressureData>(STORAGE_KEYS.CONTROL_VALVE_PRESSURE, {
    maxAllowedVentingPressure: 0,
    maxAllowableBackpressure: 0,
    maxAllowedVentingPressurePercent: 0,
    asmeSetPressure: 0,
    manufacturingRangeOverpressure: 0,
    burstToleranceOverpressure: 0
  })

  // Use flowData directly - useLocalStorage hook already handles state updates efficiently

  const handleFlowDataChange = useCallback((field: keyof GasFlowInputs, value: string | number | boolean) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }, [setFlowData])
  
  const handleGasChange = useCallback((gasKey: string) => {
    setSelectedGas(gasKey)
    const gasProps = gasKey === 'custom' ? customGasProps : COMMON_GASES[gasKey as keyof typeof COMMON_GASES]
    setFlowData(prev => ({ 
      ...prev, 
      gasProperties: gasProps,
      compressibilityZ: gasProps.defaultZ
    }))
  }, [customGasProps, setFlowData])
  
  const handleCustomGasChange = useCallback((field: keyof GasProperties, value: number | string) => {
    setCustomGasProps(prev => {
      const newCustomProps = { ...prev, [field]: value }
      // Also update flowData if custom gas is selected
      if (selectedGas === 'custom') {
        setFlowData(prevFlow => ({ ...prevFlow, gasProperties: newCustomProps }))
      }
      return newCustomProps
    })
  }, [selectedGas, setFlowData])

  const handlePressureDataChange = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Memoized calculations for performance
  const previewValues = useMemo(() => {
    const calculationResult = calculateNitrogenFlow(flowData)
    const validation = validateInputs(flowData)
    
    // Combine calculation and validation results
    return {
      ...calculationResult,
      errors: [...calculationResult.errors, ...validation.errors],
      warnings: [...calculationResult.warnings, ...validation.warnings]
    }
  }, [flowData])

  // Check if inputs are valid for enabling calculations
  const hasValidInputs = useMemo(() => {
    if (flowData.isManualFlowInput) {
      return flowData.manualFlowRate && flowData.manualFlowRate > 0
    } else {
      return flowData.totalCv && flowData.totalCv > 0 &&
             flowData.inletPressure !== undefined && flowData.inletPressure >= 0 &&
             flowData.outletPressure !== undefined && flowData.outletPressure >= 0
    }
  }, [flowData])

  // Get field-specific errors
  const getFieldError = (field: string) => {
    return previewValues.errors.find(error => 
      error.toLowerCase().includes(field.toLowerCase()) ||
      (field === 'totalCv' && error.includes('Cv')) ||
      (field === 'inletPressure' && error.includes('inlet')) ||
      (field === 'outletPressure' && error.includes('outlet'))
    )
  }

  // Auto-update case results when calculations change
  React.useEffect(() => {
    // Use netRelievingFlow (after outlet credit) for design basis
    const designFlow = previewValues.netRelievingFlow || previewValues.calculatedRelievingFlow
    
    if (designFlow && designFlow > 0 && previewValues.massFlowRate) {
      const asmeVIIIDesignFlow = Math.round(previewValues.massFlowRate)
      
      updateCaseResult('control-valve-failure', {
        asmeVIIIDesignFlow,
        isCalculated: true
      })
      
      // Save calculated results to localStorage for PDF generation
      // Note: useLocalStorage only saves flowData inputs, but report needs calculated outputs too
      const calculatedResults = {
        ...flowData,
        calculatedRelievingFlow: previewValues.calculatedRelievingFlow,
        netRelievingFlow: previewValues.netRelievingFlow,
        massFlowRate: previewValues.massFlowRate,
        asmeVIIIDesignFlow,
        effectiveCv: previewValues.effectiveCv,
        outletCreditApplied: previewValues.outletCreditApplied,
        selectedGas,
        customGasProps: selectedGas === 'custom' ? customGasProps : undefined
      }
      
      localStorage.setItem('control-valve-failure-flow-data', JSON.stringify(calculatedResults))
    }
  }, [previewValues.netRelievingFlow, previewValues.calculatedRelievingFlow, previewValues.massFlowRate, 
      previewValues.effectiveCv, previewValues.outletCreditApplied, updateCaseResult, flowData, selectedGas, customGasProps])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          {/* Back to Cases Navigation */}
          <div className="mb-2 sm:mb-4">
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
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Case 2 - Control Valve Failure (Gas Service)</h1>
              
              {/* About Section */}
              <ScenarioAbout>
                <div className="space-y-2">
                  <p>
                    <strong>Control valve failure</strong> occurs when an automatic control valve on a gas supply line fails in the open position or when a bypass valve is inadvertently opened. This allows maximum gas flow from a high-pressure source into the protected vessel, potentially causing overpressure.
                  </p>
                  <p>
                    Common scenarios include nitrogen blanket systems, instrument air supplies, inert gas padding systems, and pressure control valves on gas feeds. The failure can result from instrument air loss, controller malfunction, signal failure, or valve actuator failure.
                  </p>
                </div>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">API-521 Section 4.4.8: Failure of Automatic Controls</p>
                  <p>
                    This case implements the methodology from API-521 Section 4.4.8 for inlet control device failures. Key considerations include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Control Valve Failure:</strong> Assumes the valve fails fully open (or is sized at nameplate capacity)</li>
                    <li><strong>Bypass Valve Scenario:</strong> API-521 requires considering if bypass valves could be inadvertently opened during operations or maintenance</li>
                    <li><strong>Outlet Flow Credit:</strong> Per Section 4.4.8.3, relief rate = maximum inlet flow minus normal outlet flow. Credit can be taken for outlet valves that remain in their normal operating position</li>
                    <li><strong>Relieving Conditions:</strong> Flow calculated at maximum upstream supply pressure and vessel relieving pressure (typically 110% MAWP)</li>
                  </ul>
                </div>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">Flow Calculation Method: ISA-S75.01 Gas Flow Formulas</p>
                  <p>
                    The calculations use ISA gas flow equations (referenced in API-520 Part I) which account for choked and non-choked flow conditions through control valves. The formulas require valve flow coefficient (Cv), pressures, temperature, gas molecular weight, specific gravity, and compressibility factor.
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Note:</strong> This tool is for gas service only. Liquid control valve failures with potential vapor breakthrough require specialized dynamic analysis.
                  </p>
                </div>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">Standards References</p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <div><strong>ASME Section VIII Div. 1 UG-125/UG-131:</strong> Defines accumulation limits (110%, 116%, 121%)</div>
                    <div><strong>API-521 Section 4.4.8:</strong> Failure of Automatic Controls (inlet control devices, bypass valves, outlet credit)</div>
                    <div><strong>API-520 Part I:</strong> Valve sizing equations (ISA-S75.01 gas flow formulas)</div>
                    <div><strong>CSA B51:</strong> Canadian adoption of ASME VIII with registration requirements</div>
                  </div>
                </div>
              </ScenarioAbout>
            </div>

            {/* Include Case Toggle - Right Side on desktop, below title on mobile */}
            <div className="sm:ml-6 space-y-2 sm:space-y-3 w-full sm:w-auto">
              <div className="flex items-center justify-start sm:justify-end space-x-2">
                <span className="text-sm font-medium text-gray-700">Include Case</span>
                <div className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                  ${isSelected ? 'bg-green-600' : 'bg-gray-200'}
                `}
                onClick={() => toggleCase('control-valve-failure')}
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
        </div>

        <div className={`space-y-8 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
          {/* Applicability & Limitations */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Applicability & Limitations</h3>
            <div className="text-xs text-amber-800 space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Gas service control valves (N₂, air, O₂, CO₂, CH₄, custom gases)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Single inlet valve failure scenarios</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Steady-state flow calculations</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span>Liquid service with vapor breakthrough (requires specialized analysis)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span>Multiple simultaneous valve failures (analyze separately and sum flows)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span>Transient pressure surge or water hammer analysis</span>
              </div>
            </div>
          </div>

          {/* Gas Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Gas Selection</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Gas Type
                </label>
                <select
                  value={selectedGas}
                  onChange={(e) => handleGasChange(e.target.value)}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                    !isSelected 
                      ? 'border-gray-200 bg-gray-50 text-gray-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  disabled={!isSelected}
                >
                  {Object.entries(COMMON_GASES).map(([key, gas]) => (
                    <option key={key} value={key}>{gas.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MW
                </label>
                {selectedGas === 'custom' ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={customGasProps.molecularWeight}
                      onChange={(e) => handleCustomGasChange('molecularWeight', parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 py-2 pr-20 border border-gray-300 rounded-md text-gray-900 bg-white"
                      disabled={!isSelected}
                      placeholder="28.0"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                      lb/lbmol
                    </span>
                  </div>
                ) : (
                  <div className="h-10 px-3 py-2 bg-blue-50 border border-gray-300 rounded-md flex items-center">
                    <span className="text-gray-900">{flowData.gasProperties?.molecularWeight.toFixed(2)} lb/lbmol</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SG
                </label>
                {selectedGas === 'custom' ? (
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="10"
                    value={customGasProps.specificGravity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val) && val >= 0) {
                        handleCustomGasChange('specificGravity', val)
                      }
                    }}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    disabled={!isSelected}
                    placeholder="1.000"
                  />
                ) : (
                  <div className="h-10 px-3 py-2 bg-blue-50 border border-gray-300 rounded-md flex items-center">
                    <span className="text-gray-900">{flowData.gasProperties?.specificGravity.toFixed(3)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vessel Properties - Shared across all cases (hide working fluid for nitrogen case) */}
          <VesselProperties 
            vesselData={vesselData} 
            onChange={updateVesselData}
            hideWorkingFluid={true}
            disabled={!isSelected}
          />

          {/* Case-Specific Pressure Settings */}
          <CasePressureSettings
            pressureData={pressureData}
            onChange={handlePressureDataChange}
            caseName="Control Valve Failure"
            isAutoCalculated={true}
            vesselMawp={vesselData.vesselDesignMawp}
            mawpPercent={110}
            disabled={!isSelected}
          />

          {/* Flow Calculation Method Choice */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculation Method</h2>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={flowData.isManualFlowInput}
                  onChange={() => handleFlowDataChange('isManualFlowInput', true)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Manual Flow Input</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!flowData.isManualFlowInput}
                  onChange={() => handleFlowDataChange('isManualFlowInput', false)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Pressure-Based Calculation</span>
              </label>
            </div>
          </div>

          {/* Flow Calculations - Only user inputs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
            <p className="text-sm text-gray-600 mb-4">
              User inputs only - other values are calculated automatically
            </p>
            
            {flowData.isManualFlowInput ? (
              // Manual Flow Input
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mass Flow Rate
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={flowData.manualFlowRate || ''}
                  onChange={(e) => handleFlowDataChange('manualFlowRate', parseFloat(e.target.value) || 0)}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                    !isSelected 
                      ? 'border-gray-200 bg-gray-50 text-gray-500' 
                      : getFieldError('manualFlowRate') 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  disabled={!isSelected}
                />
                  <p className="text-xs text-gray-500 mt-1">lb/hr</p>
                  {getFieldError('manualFlowRate') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('manualFlowRate')}</p>
                  )}
                </div>
              </div>
            ) : (
              // Pressure-Based Calculation
              <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Total Cv
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Flow coefficient from valve datasheet"
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.totalCv || ''}
                    onChange={(e) => handleFlowDataChange('totalCv', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : getFieldError('totalCv') 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                  />
                  {getFieldError('totalCv') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('totalCv')}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Max. Upstream Supply Pressure (P₁)
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Maximum conceivable pressure directly upstream of failing control valve (e.g., supply header pressure, regulator max output)"
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.inletPressure || ''}
                    onChange={(e) => handleFlowDataChange('inletPressure', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : getFieldError('inletPressure') 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                  />
                  <p className="text-xs text-gray-500 mt-1">psig</p>
                  {getFieldError('inletPressure') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('inletPressure')}</p>
                  )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Vessel Relieving Pressure (P₂)
                    </label>
                  <Tooltip 
                    className="min-w-max"
                    content="Pressure in the protected vessel during relief. Typically MAWP × 1.10 for single PRD. Should match the relieving pressure from Case Pressure Settings."
                  />
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={flowData.outletPressure || ''}
                  onChange={(e) => handleFlowDataChange('outletPressure', parseFloat(e.target.value) || 0)}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                    !isSelected 
                      ? 'border-gray-200 bg-gray-50 text-gray-500' 
                      : getFieldError('outletPressure') 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  disabled={!isSelected}
                />
                  <p className="text-xs text-gray-500 mt-1">psig (typically {Math.round(pressureData.maxAllowedVentingPressure * 10) / 10} for this vessel)</p>
                  {getFieldError('outletPressure') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('outletPressure')}</p>
                  )}
                </div>

                {/* User-editable temperature */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Temperature
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Flowing gas temperature at valve"
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.temperatureF || ''}
                    onChange={(e) => handleFlowDataChange('temperatureF', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                  />
                  <p className="text-xs text-gray-500 mt-1">°F</p>
                </div>

                {/* User-editable compressibility */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Compressibility Factor (Z)
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Gas compressibility factor (1.0 for ideal)"
                    />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={flowData.compressibilityZ || ''}
                    onChange={(e) => handleFlowDataChange('compressibilityZ', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                  />
                  <p className="text-xs text-gray-500 mt-1">~1.0 for nitrogen</p>
                </div>

                {/* User-editable x_t */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pressure Drop Ratio Factor (x<sub>t</sub>)
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Critical pressure drop ratio from valve datasheet"
                    />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={flowData.xt || ''}
                    onChange={(e) => handleFlowDataChange('xt', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                  />
                  <p className="text-xs text-gray-500 mt-1">~0.7 for globe valves</p>
              </div>

                {/* Display only - specific gravity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Gravity
                </label>
                <input
                  type="number"
                    value={flowData.gasProperties?.specificGravity || 1.0}
                    disabled
                    className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-gray-700 font-medium"
                    title="Gas specific gravity (from selected gas)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Relative to air</p>
                </div>
              
                {/* Flow Regime Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flow Regime
                  </label>
                  <div className={`w-full h-10 px-3 py-2 border rounded-md flex items-center ${
                    previewValues.flowRegime && hasValidInputs 
                      ? 'border-blue-200 bg-blue-50 text-blue-900' 
                      : 'border-gray-200 bg-gray-50 text-gray-400'
                  }`}>
                    {previewValues.flowRegime && hasValidInputs ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">
                          {previewValues.flowRegime}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm">Not calculated</span>
                    )}
                  </div>
                </div>
              </div>
            
              {/* Bypass Valve Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="considerBypass"
                    checked={flowData.considerBypass || false}
                    onChange={(e) => handleFlowDataChange('considerBypass', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={!isSelected}
                  />
                  <label htmlFor="considerBypass" className="text-sm font-semibold text-gray-900">
                    Consider Bypass Valve Scenario
                  </label>
                  <Tooltip 
                    className="w-96"
                    content={
                      <div>
                        <div className="font-semibold mb-2">API-521 Section 4.4.8.3: Bypass Valve Consideration</div>
                        <p className="mb-2">
                          API-521 requires considering if bypass valves could be inadvertently opened during operations or maintenance.
                        </p>
                        <p className="mb-2">
                          <strong>Scenario:</strong> Both control valve AND bypass valve are wide open simultaneously.
                        </p>
                        <p className="text-xs mt-2 pt-2 border-t border-gray-600">
                          <strong>Calculation:</strong> Total Effective Cv = Control Valve Cv + Bypass Valve Cv
                        </p>
                      </div>
                    }
                  />
                </div>
                
                {flowData.considerBypass && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Bypass Valve Cv
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={flowData.bypassCv || ''}
                        onChange={(e) => handleFlowDataChange('bypassCv', parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                        disabled={!isSelected}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total Effective Cv
                      </label>
                      <input
                        type="number"
                        value={((flowData.totalCv || 0) + (flowData.bypassCv || 0)).toFixed(1)}
                        disabled
                        className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-gray-700 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Outlet Flow Credit Section */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="creditOutletFlow"
                    checked={flowData.creditOutletFlow || false}
                    onChange={(e) => handleFlowDataChange('creditOutletFlow', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={!isSelected}
                  />
                  <label htmlFor="creditOutletFlow" className="text-sm font-semibold text-gray-900">
                    Apply Outlet Flow Credit
                  </label>
                  <Tooltip 
                    className="w-96"
                    content={
                      <div>
                        <div className="font-semibold mb-2">API-521 Section 4.4.8.3: Outlet Flow Credit</div>
                        <p className="mb-2">
                          Per API-521, the required relieving rate is the difference between maximum inlet flow and normal outlet flow.
                        </p>
                        <p className="mb-2">
                          <strong>Credit can be taken</strong> for outlet valves that remain in their normal operating position during the control valve failure.
                        </p>
                        <p className="text-xs mt-2 pt-2 border-t border-gray-600">
                          <strong>Calculation:</strong> Net Relief Flow = Gross Inlet Flow - Normal Outlet Flow
                        </p>
                      </div>
                    }
                  />
                </div>
                
                {flowData.creditOutletFlow && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Normal Outlet Flow (SCFH)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={flowData.outletFlowCredit || ''}
                        onChange={(e) => handleFlowDataChange('outletFlowCredit', parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                        disabled={!isSelected}
                        placeholder="Normal operating outlet flow"
                      />
                      <p className="text-xs text-gray-500 mt-1">Flow at normal minimum conditions</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Net Relief Flow
                      </label>
                      <input
                        type="text"
                        value={previewValues.netRelievingFlow !== null ? `${previewValues.netRelievingFlow.toLocaleString()} SCFH` : '—'}
                        disabled
                        className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-gray-700 font-medium"
                      />
                      <p className="text-xs text-gray-500 mt-1">Inlet flow - Outlet credit</p>
                    </div>
                  </div>
                )}
              </div>
              </>
            )}

            {/* Error and Warning Display */}
            {(previewValues.errors.length > 0 || previewValues.warnings.length > 0) && (
              <div className="mt-4 space-y-2">
                {previewValues.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-600 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                ))}
                {previewValues.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center gap-2 text-yellow-600 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {warning}
                  </div>
                ))}
            </div>
            )}

            {/* Calculated values preview (read-only) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Calculated Results</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Gross Inlet Flow
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        flowData.isManualFlowInput ? (
                          <>
                            <div>
                              <div className="font-semibold mb-2">Manual Input Path:</div>
                              <div>Direct user input converted to SCFH using:</div>
                              <div>SCFH = (lb/hr ÷ MW) × 379</div>
                              <div className="text-xs mt-2 border-t border-gray-600 pt-2">
                                MW = Molecular Weight of selected gas
                              </div>
                            </div>
                          </>
                        ) : (
                          <div>
                            <div className="font-semibold mb-2">ISA-S75.01 Gas Flow Formulas (API-520):</div>
                            <div className="mb-2">
                              <div className="font-medium">Choked Flow (x ≥ xt):</div>
                              <div>Q = 1360 × Cv × xt × P1 ÷ √(G × T × Z)</div>
                            </div>
                            <div className="mb-2">
                              <div className="font-medium">Non-choked Flow (x &lt; xt):</div>
                              <div>Q = 1360 × Cv × Y × P1 × √(x ÷ (G × T × Z))</div>
                            </div>
                            <div className="text-xs border-t border-gray-600 pt-2">
                              <div>Q = Flow (SCFH), Cv = Effective flow coefficient</div>
                              <div>P1 = Inlet pressure (psia), T = Temperature (°R)</div>
                              <div>G = Specific gravity, Z = Compressibility factor</div>
                              <div>x = Pressure drop ratio, Y = Expansion factor = max(2/3, 1-x/(3xt))</div>
                            </div>
                          </div>
                        )
                      }
                    />
                  </div>
                  <div className={`p-3 rounded border ${
                    hasValidInputs ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className={`font-medium ${
                      hasValidInputs ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {hasValidInputs && previewValues.calculatedRelievingFlow 
                        ? `${previewValues.calculatedRelievingFlow.toLocaleString()} SCFH` 
                        : hasValidInputs ? '—' : 'Enter valid inputs'
                      }
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Before outlet credit</p>
                </div>
                
                {flowData.creditOutletFlow && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Net Relief Flow
                      </label>
                      <Tooltip 
                        className="min-w-max"
                        content="Gross inlet flow minus normal outlet flow credit per API-521"
                      />
                    </div>
                    <div className={`p-3 rounded border ${
                      hasValidInputs ? 'bg-green-50 border-green-300' : 'bg-gray-50'
                    }`}>
                      <div className={`font-bold ${
                        hasValidInputs ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        {hasValidInputs && previewValues.netRelievingFlow !== null
                          ? `${previewValues.netRelievingFlow.toLocaleString()} SCFH` 
                          : hasValidInputs ? '—' : 'Enter valid inputs'
                        }
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {previewValues.outletCreditApplied ? `${previewValues.outletCreditApplied.toLocaleString()} SCFH credited` : 'For relief sizing'}
                    </p>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Mass Flow Rate
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="SCFH × (MW / 379) = lb/hr"
                    />
                  </div>
                  <div className={`p-3 rounded border ${
                    hasValidInputs ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className={`font-bold ${
                      hasValidInputs ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {hasValidInputs && previewValues.massFlowRate 
                        ? `${previewValues.massFlowRate.toLocaleString()} lb/hr` 
                        : hasValidInputs ? '—' : 'Enter valid inputs to calculate'
                      }
                    </div>
                  </div>
                </div>

                {previewValues.effectiveCv && flowData.considerBypass && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Effective Cv Used
                      </label>
                      <Tooltip 
                        className="min-w-max"
                        content="Control valve Cv + Bypass valve Cv"
                      />
                    </div>
                    <div className="p-3 rounded border bg-blue-50">
                      <div className="font-medium text-gray-700">
                        {previewValues.effectiveCv.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Control + Bypass</p>
                  </div>
                )}

                {/* 4th column - Design Basis Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Design Basis Flow?
                    </label>
                  </div>
                  <div className={`p-3 rounded border ${
                    previewValues.calculatedRelievingFlow && previewValues.calculatedRelievingFlow > 0 ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className={`font-medium ${
                      previewValues.calculatedRelievingFlow && previewValues.calculatedRelievingFlow > 0 ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {(() => {
                        const designBasisFlow = getDesignBasisFlow()
                        const designFlow = previewValues.netRelievingFlow || previewValues.calculatedRelievingFlow
                        const isCurrentDesignBasis = designBasisFlow && 
                          designBasisFlow.caseId === 'control-valve-failure' && 
                          designFlow && 
                          designFlow > 0
                        
                        if (isCurrentDesignBasis) {
                          return 'Yes'
                        } else if (designFlow && designFlow > 0) {
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