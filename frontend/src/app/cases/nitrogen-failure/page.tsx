'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import VesselProperties from '../../components/VesselProperties'
import CasePressureSettings from '../../components/CasePressureSettings'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { 
  calculateNitrogenFlow, 
  validateInputs, 
  type NitrogenFlowInputs, 
  NITROGEN_CONSTANTS,
  UNIT_CONSTANTS
} from './calculations'

type NitrogenFlowData = NitrogenFlowInputs

interface CasePressureData {
  maxAllowedVentingPressure: number
  maxAllowableBackpressure: number
  maxAllowedVentingPressurePercent: number
  asmeSetPressure: number
  manufacturingRangeOverpressure: number
  burstToleranceOverpressure: number
}

export default function NitrogenFailureCase() {
  const { vesselData, updateVesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const isSelected = selectedCases['nitrogen-control']
  
  useScrollPosition()

  const [flowData, setFlowData] = useState<NitrogenFlowData>({
    isManualFlowInput: false,
    manualFlowRate: 0,
    totalCv: 0,
    inletPressure: 0,
    outletPressure: 0,
    temperatureF: 80,        // User editable with default
    compressibilityZ: 1.0,   // User editable with default
    xt: 0.7                  // User editable with default
  })

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem('nitrogen-control-flow-data')
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
    maxAllowedVentingPressurePercent: 0,
    asmeSetPressure: 0,
    manufacturingRangeOverpressure: 0,
    burstToleranceOverpressure: 0
  })

  // Debounced flow data change handler
  const [debouncedFlowData, setDebouncedFlowData] = useState(flowData)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFlowData(flowData)
    }, 250) // 250ms debounce
    
    return () => clearTimeout(timer)
  }, [flowData])

  const handleFlowDataChange = useCallback((field: keyof NitrogenFlowData, value: string | number | boolean) => {
    const newData = { ...flowData, [field]: value }
    setFlowData(newData)
    
    // Save to localStorage (client-side only)
    localStorage.setItem('nitrogen-control-flow-data', JSON.stringify(newData))
  }, [flowData])

  const handlePressureDataChange = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Memoized calculation using debounced data
  const previewValues = useMemo(() => {
    const calculationResult = calculateNitrogenFlow(debouncedFlowData)
    const validation = validateInputs(debouncedFlowData)
    
    // Combine calculation and validation results
    return {
      ...calculationResult,
      errors: [...calculationResult.errors, ...validation.errors],
      warnings: [...calculationResult.warnings, ...validation.warnings]
    }
  }, [debouncedFlowData])

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
    if (previewValues.calculatedRelievingFlow && previewValues.calculatedRelievingFlow > 0) {
      // Convert SCFH to lb/hr for case result storage
      const massFlowRate = (previewValues.calculatedRelievingFlow / UNIT_CONSTANTS.scfhConversion) * NITROGEN_CONSTANTS.molecularWeight
      
      updateCaseResult('nitrogen-control', {
        asmeVIIIDesignFlow: Math.round(massFlowRate),
        isCalculated: true
      })
    }
  }, [previewValues.calculatedRelievingFlow, updateCaseResult])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Case 2 - Nitrogen Control Failure</h1>
              <p className="text-gray-600">
                Calculate relief requirements for nitrogen control failure scenarios.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Include Case</span>
              <div className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                ${isSelected ? 'bg-green-600' : 'bg-gray-200'}
              `}
              onClick={() => toggleCase('nitrogen-control')}
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
          {/* Standards Reference */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Standards References</h3>
            <div className="text-xs text-blue-800 space-y-1">
              <div><strong>ASME Section VIII Div. 1 UG-125/UG-131:</strong> Defines accumulation limits (110%, 116%, 121%)</div>
              <div><strong>API 521:</strong> Scenario definition (control valve failure open)</div>
              <div><strong>API 520:</strong> Valve sizing equations (ISA gas flow formulas)</div>
              <div><strong>CSA B51:</strong> Canadian adoption of ASME VIII with registration requirements</div>
            </div>
          </div>

          {/* Vessel Properties - Shared across all cases (hide working fluid for nitrogen case) */}
          <VesselProperties 
            vesselData={vesselData} 
            onChange={updateVesselData}
            hideWorkingFluid={true}
          />

          {/* Case-Specific Pressure Settings */}
          <CasePressureSettings
            pressureData={pressureData}
            onChange={handlePressureDataChange}
            caseName="Nitrogen Control Failure"
            isAutoCalculated={true}
            vesselMawp={vesselData.vesselDesignMawp}
            mawpPercent={110}
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
                    className={`w-full h-10 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                      getFieldError('manualFlowRate') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">lb/hr</p>
                  {getFieldError('manualFlowRate') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('manualFlowRate')}</p>
                  )}
                </div>
              </div>
            ) : (
              // Pressure-Based Calculation
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Total Cv
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
                        Flow coefficient from valve datasheet
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.totalCv || ''}
                    onChange={(e) => handleFlowDataChange('totalCv', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                      getFieldError('totalCv') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('totalCv') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('totalCv')}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Inlet Pressure
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
                        Upstream pressure at relieving conditions
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.inletPressure || ''}
                    onChange={(e) => handleFlowDataChange('inletPressure', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                      getFieldError('inletPressure') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">psig</p>
                  {getFieldError('inletPressure') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('inletPressure')}</p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outlet Pressure
                </label>
                <input
                  type="number"
                  step="0.1"
                    value={flowData.outletPressure || ''}
                    onChange={(e) => handleFlowDataChange('outletPressure', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                      getFieldError('outletPressure') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">psig</p>
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
                        Flowing gas temperature at valve
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.temperatureF || ''}
                    onChange={(e) => handleFlowDataChange('temperatureF', parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">°F</p>
                </div>

                {/* User-editable compressibility */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Compressibility Factor (Z)
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
                        Gas compressibility factor (1.0 for ideal)
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={flowData.compressibilityZ || ''}
                    onChange={(e) => handleFlowDataChange('compressibilityZ', parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">~1.0 for nitrogen</p>
                </div>

                {/* User-editable x_t */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pressure Drop Ratio Factor (x_t)
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
                        Critical pressure drop ratio from valve datasheet
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={flowData.xt || ''}
                    onChange={(e) => handleFlowDataChange('xt', parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">~0.7 for globe valves</p>
              </div>

                {/* Objective constant - specific gravity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Gravity
                </label>
                <input
                  type="number"
                    value={NITROGEN_CONSTANTS.specificGravity}
                    disabled
                    className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-gray-700 font-medium"
                    title="Nitrogen specific gravity (objective value)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Relative to air</p>
                </div>
              </div>
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
              {/* Flow Regime Display */}
              {previewValues.flowRegime && hasValidInputs && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-900">
                      Flow Regime: {previewValues.flowRegime}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Calculated Nitrogen Inflow
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
                        {flowData.isManualFlowInput ? (
                          <div>
                            <div className="font-semibold mb-2">Manual Input Path:</div>
                            <div>Direct user input converted to SCFH using:</div>
                            <div>SCFH = (lb/hr ÷ MW) × 379</div>
                            <div className="text-xs mt-2 border-t border-gray-600 pt-2">
                              MW = Molecular Weight (N₂ = 28.0134)
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold mb-2">ISA Gas Flow Formulas (API 520):</div>
                            <div className="mb-2">
                              <div className="font-medium">Choked Flow (x ≥ xt):</div>
                              <div>Q = 1360 × Cv × xt × P1 ÷ √(G × T × Z)</div>
                            </div>
                            <div className="mb-2">
                              <div className="font-medium">Non-choked Flow (x &lt; xt):</div>
                              <div>Q = 1360 × Cv × Y × P1 × √(x ÷ (G × T × Z))</div>
                            </div>
                            <div className="text-xs border-t border-gray-600 pt-2">
                              <div>Q = Flow (SCFH), Cv = Flow coefficient</div>
                              <div>P1 = Inlet pressure (psia), T = Temperature (°R)</div>
                              <div>G = Specific gravity, Z = Compressibility factor</div>
                              <div>x = Pressure drop ratio, Y = Expansion factor</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${
                    hasValidInputs ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className={`font-medium ${
                      hasValidInputs ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {hasValidInputs && previewValues.calculatedRelievingFlow 
                        ? `${previewValues.calculatedRelievingFlow.toLocaleString()} SCFH` 
                        : hasValidInputs ? '—' : 'Enter valid inputs to calculate'
                      }
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Mass Flow Rate
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
                        SCFH × (MW / 379) = lb/hr
                      </div>
                    </div>
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

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      API 520 Valve Inflow
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
                        Same as calculated inflow - no flow multiplication needed
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${
                    hasValidInputs ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className={`font-medium ${
                      hasValidInputs ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {hasValidInputs && previewValues.api520ValveInflow 
                        ? `${previewValues.api520ValveInflow.toLocaleString()} SCFH` 
                        : hasValidInputs ? '—' : 'Enter valid inputs to calculate'
                      }
                    </div>
                  </div>
                </div>

                {/* 4th column - Design Basis Status */}
                <div className="flex items-end">
                  <div className="text-base text-gray-600 p-3 flex items-end">
                    {(() => {
                      const designBasisFlow = getDesignBasisFlow()
                      const isCurrentDesignBasis = designBasisFlow && 
                        designBasisFlow.caseName === 'Nitrogen Control Failure' && 
                        previewValues.calculatedRelievingFlow && 
                        previewValues.calculatedRelievingFlow > 0
                      
                      if (isCurrentDesignBasis) {
                        return (
                          <div className="text-gray-900">
                            This <strong>is</strong> the current Design Basis Flow
                          </div>
                        )
                      } else if (previewValues.calculatedRelievingFlow && previewValues.calculatedRelievingFlow > 0) {
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