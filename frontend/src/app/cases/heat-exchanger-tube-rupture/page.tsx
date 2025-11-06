'use client'

import React from 'react'
import CollapsibleVesselProperties from '../../components/CollapsibleVesselProperties'
import CasePressureSettings from '../../components/CasePressureSettings'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import Tooltip from '../../components/Tooltip'
import DesignBasisFlowBanner from '../../components/DesignBasisFlowBanner'
import CasePageHeader from '../../components/CasePageHeader'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useCaseCalculation } from '../../hooks/useCaseCalculation'
import { CasePressureData, STORAGE_KEYS } from '../../types/case-types'
import { getFluidNames } from '../../../../lib/database'

type ExchangerType = 'shell-and-tube' | 'double-pipe' | 'plate-and-frame'
type FluidState = 'liquid' | 'gas' | 'flashing-liquid'

interface FlowData {
  workingFluid: string
  exchangerType: ExchangerType
  fluidState: FluidState
  // High-pressure side
  highPressureSide: number  // psig
  temperatureF: number      // °F
  // Tube properties
  tubeInnerDiameter: number  // inches
  numberOfTubes: number      // typically 1 for single tube rupture
  // Fluid properties
  fluidDensity: number       // lb/ft³ for liquids
  molecularWeight: number    // for gases
  specificHeatRatio: number  // k for gases (Cp/Cv)
  // Relief requirements check
  reliefRequired: boolean
}

export default function HeatExchangerTubeRupturePage() {
  const { vesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const designBasisFlow = getDesignBasisFlow()
  const isSelected = selectedCases['heat-exchanger-tube-rupture']

  useScrollPosition()

  const [flowData, setFlowData] = useLocalStorage<FlowData>(STORAGE_KEYS.HEAT_EXCHANGER_TUBE_RUPTURE_FLOW, {
    workingFluid: '',
    exchangerType: 'shell-and-tube',
    fluidState: 'liquid',
    highPressureSide: 0,
    temperatureF: 80,
    tubeInnerDiameter: 0.75,  // Default 3/4" tube
    numberOfTubes: 1,          // Default single tube failure
    fluidDensity: 62.4,        // Default water density
    molecularWeight: 28,       // Default for gas
    specificHeatRatio: 1.4,    // Default for air/N2
    reliefRequired: true
  })

  const [pressureData, setPressureData] = useLocalStorage<CasePressureData>(
    STORAGE_KEYS.HEAT_EXCHANGER_TUBE_RUPTURE_PRESSURE,
    {
      maxAllowedVentingPressure: 0,
      maxAllowableBackpressure: 0,
      maxAllowedVentingPressurePercent: 110
    }
  )

  const updateFlowData = (field: keyof FlowData, value: string | number | boolean) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }

  const updatePressureData = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate preview values
  const previewValues = React.useMemo(() => {
    // Check if relief is required based on pressure criteria
    const lowPressureSideDesignPressure = vesselData.vesselDesignMawp
    const reliefRequired = flowData.highPressureSide > lowPressureSideDesignPressure
    
    if (!reliefRequired || !flowData.tubeInnerDiameter || flowData.tubeInnerDiameter <= 0) {
      return {
        reliefRequired,
        tubeFlowArea: 0,
        singleTubeFlow: 0,
        totalTubeFlow: 0,
        calculatedRelievingFlow: 0,
        asmeVIIIDesignFlow: 0,
        pressureDifferential: flowData.highPressureSide - lowPressureSideDesignPressure
      }
    }

    // Calculate tube flow area (ft²)
    const tubeID_inches = flowData.tubeInnerDiameter
    const tubeFlowArea = Math.PI * Math.pow(tubeID_inches / 12, 2) / 4  // ft²

    let singleTubeFlow = 0  // lb/hr

    // Flow calculation based on fluid state
    if (flowData.fluidState === 'liquid') {
      // Liquid flow through orifice - simplified Bernoulli equation
      // Q (gpm) = C * A * sqrt(2 * g * ΔP / ρ) where C ≈ 0.6 for sharp-edged orifice
      const C = 0.6  // Discharge coefficient
      const g = 32.174  // ft/s²
      const pressureDiff_psi = flowData.highPressureSide - pressureData.maxAllowedVentingPressure
      const pressureDiff_psf = pressureDiff_psi * 144  // convert to psf
      const rho = flowData.fluidDensity  // lb/ft³
      
      if (pressureDiff_psi > 0 && rho > 0) {
        const velocity = C * Math.sqrt(2 * g * pressureDiff_psf / rho)  // ft/s
        const volumetricFlow_cfs = velocity * tubeFlowArea  // ft³/s
        const massFlow_lbs = volumetricFlow_cfs * rho  // lb/s
        singleTubeFlow = massFlow_lbs * 3600  // lb/hr
      }
    } else if (flowData.fluidState === 'gas') {
      // Gas flow through orifice - compressible flow
      const C = 0.6  // Discharge coefficient
      const P1_psia = flowData.highPressureSide + 14.7
      const P2_psia = pressureData.maxAllowedVentingPressure + 14.7
      const k = flowData.specificHeatRatio
      const MW = flowData.molecularWeight
      const T_rankine = flowData.temperatureF + 459.67
      
      // Critical pressure ratio
      const criticalRatio = Math.pow(2 / (k + 1), k / (k - 1))
      const actualRatio = P2_psia / P1_psia
      
      if (P1_psia > P2_psia) {
        let W = 0  // Mass flow rate, lb/hr
        
        if (actualRatio < criticalRatio) {
          // Choked flow
          const term1 = C * tubeFlowArea * P1_psia * 144
          const term2 = Math.sqrt((k * 32.174 * MW) / (10.73 * T_rankine))
          const term3 = Math.sqrt(Math.pow(2 / (k + 1), (k + 1) / (k - 1)))
          W = term1 * term2 * term3 * 3600
        } else {
          // Non-choked flow
          const term1 = C * tubeFlowArea * P1_psia * 144
          const term2 = Math.sqrt((2 * 32.174 * k * MW) / ((k - 1) * 10.73 * T_rankine))
          const term3 = Math.sqrt(Math.pow(actualRatio, 2 / k) - Math.pow(actualRatio, (k + 1) / k))
          W = term1 * term2 * term3 * 3600
        }
        
        singleTubeFlow = W
      }
    } else {
      // Flashing liquid - use simplified approach (conservative: treat as liquid)
      // In practice, would use HEM or other two-phase model
      const C = 0.6
      const g = 32.174
      const pressureDiff_psi = flowData.highPressureSide - pressureData.maxAllowedVentingPressure
      const pressureDiff_psf = pressureDiff_psi * 144
      const rho = flowData.fluidDensity
      
      if (pressureDiff_psi > 0 && rho > 0) {
        const velocity = C * Math.sqrt(2 * g * pressureDiff_psf / rho)
        const volumetricFlow_cfs = velocity * tubeFlowArea
        const massFlow_lbs = volumetricFlow_cfs * rho
        singleTubeFlow = massFlow_lbs * 3600
      }
    }

    const totalTubeFlow = singleTubeFlow * flowData.numberOfTubes
    const calculatedRelievingFlow = totalTubeFlow
    
    // ASME VIII Design Flow includes safety factor
    // For liquid: divide by 0.9 (110% accumulation)
    // For gas: flow is already at relieving conditions, so may use different factor
    const safetyFactor = flowData.fluidState === 'liquid' ? 0.9 : 0.9
    const asmeVIIIDesignFlow = calculatedRelievingFlow > 0 
      ? Math.round(calculatedRelievingFlow / safetyFactor) 
      : 0

    return {
      reliefRequired,
      tubeFlowArea,
      singleTubeFlow,
      totalTubeFlow,
      calculatedRelievingFlow,
      asmeVIIIDesignFlow,
      pressureDifferential: flowData.highPressureSide - lowPressureSideDesignPressure
    }
  }, [
    flowData.highPressureSide,
    flowData.tubeInnerDiameter,
    flowData.numberOfTubes,
    flowData.fluidState,
    flowData.fluidDensity,
    flowData.molecularWeight,
    flowData.specificHeatRatio,
    flowData.temperatureF,
    vesselData.vesselDesignMawp,
    pressureData.maxAllowedVentingPressure
  ])

  const hasValidInputs = 
    flowData.tubeInnerDiameter > 0 &&
    flowData.highPressureSide > 0 &&
    (flowData.fluidState === 'gas' || flowData.fluidDensity > 0)

  // Auto-update case results when calculations change
  useCaseCalculation({
    caseId: 'heat-exchanger-tube-rupture',
    previewValues,
    flowData,
    updateCaseResult,
    storageKey: STORAGE_KEYS.HEAT_EXCHANGER_TUBE_RUPTURE_FLOW
  })

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />
        
        <DesignBasisFlowBanner designBasisFlow={designBasisFlow} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 mobile-pt-0">
          <CasePageHeader
            caseName="Heat Exchanger Tube Rupture"
            title="Heat Exchanger Tube Rupture"
            isSelected={isSelected}
            onToggle={() => toggleCase('heat-exchanger-tube-rupture')}
            aboutContent={
              <>
                <p>
                  <strong>Heat exchanger tube rupture</strong> occurs when an internal failure in a heat exchanger allows high-pressure fluid to flow into the lower-pressure side, potentially causing overpressure of the low-pressure side and connected equipment.
                </p>
                <p>
                  This scenario must be evaluated for any heat exchanger where the high-pressure side exceeds the low-pressure side&apos;s design pressure. Common causes include tube corrosion, erosion, vibration-induced fatigue, thermal cycling, and brittle fracture.
                </p>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">API-521 Section 4.4.14: Heat Transfer Equipment Failure</p>
                  <p>
                    Per API-521 Section 4.4.14, key considerations include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Pressure Criteria:</strong> Relief not required if low-pressure side design pressure exceeds high-pressure side operating pressure, or if overpressure would not exceed corrected hydrotest pressure</li>
                    <li><strong>Design Basis:</strong> Typically assumes complete rupture of one tube (guillotine break at tubesheet)</li>
                    <li><strong>Alternative Analysis:</strong> Detailed analysis considering tube material, thickness, corrosion rates, and inspection programs may justify smaller leak size</li>
                    <li><strong>Exchanger Types:</strong> Different considerations for shell-and-tube, double-pipe, and plate-and-frame exchangers</li>
                    <li><strong>Fluid Considerations:</strong> Must account for flashing liquids, two-phase flow, and intimate mixing effects</li>
                    <li><strong>Dynamic Analysis:</strong> Recommended for large pressure differentials (&gt;1000 psi) or liquid-filled low-pressure sides</li>
                    <li><strong>Device Location:</strong> PRD should be located directly on exchanger or immediately adjacent to minimize pressure transients</li>
                  </ul>
                </div>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">Calculation Method</p>
                  <p>
                    <strong>For Liquids (Non-flashing):</strong> Use incompressible flow through orifice equations. Flow = C × A × √(2gΔP/ρ) where C is discharge coefficient (~0.6 for sharp-edged orifice).
                  </p>
                  <p>
                    <strong>For Gases:</strong> Use compressible flow equations accounting for choked vs non-choked conditions based on critical pressure ratio.
                  </p>
                  <p>
                    <strong>For Flashing Liquids:</strong> Two-phase flow methods (HEM model) should be used. This tool provides simplified calculation; detailed analysis may be required.
                  </p>
                </div>
                
                <p className="text-xs text-gray-600 border-t border-blue-200 pt-2">
                  <strong>Note:</strong> This tool provides steady-state calculations. For high pressure differentials or liquid-filled systems, dynamic analysis is recommended per API-521 Section 4.4.14.2.2.
                </p>
              </>
            }
          />

          <div className={`space-y-8 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
            {/* Vessel Properties */}
            <CollapsibleVesselProperties />

            {/* Case Pressure Settings */}
            <CasePressureSettings
              pressureData={pressureData}
              onChange={updatePressureData}
              caseName="Heat Exchanger Tube Rupture"
              isAutoCalculated={true}
              vesselMawp={vesselData.vesselDesignMawp}
              mawpPercent={110}
              disabled={!isSelected}
            />

            {/* Exchanger Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Exchanger Configuration</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Fluid
                  </label>
                  <select
                    value={flowData.workingFluid || ''}
                    onChange={(e) => updateFlowData('workingFluid', e.target.value)}
                    disabled={!isSelected}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select fluid...</option>
                    {getFluidNames().map((fluid: string) => (
                      <option key={fluid} value={fluid}>
                        {fluid}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Exchanger Type
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="font-semibold mb-2">Exchanger Types:</div>
                          <div className="space-y-2 text-sm">
                            <div><strong>Shell-and-Tube:</strong> Most common. Full tube rupture assumed unless detailed analysis justifies smaller leak.</div>
                            <div><strong>Double-Pipe:</strong> Schedule pipe less likely to rupture. Weld failures possible with dissimilar metals.</div>
                            <div><strong>Plate-and-Frame:</strong> More likely to leak at external gaskets. Internal plate failures can occur from corrosion.</div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <select
                    value={flowData.exchangerType}
                    onChange={(e) => updateFlowData('exchangerType', e.target.value)}
                    disabled={!isSelected}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="shell-and-tube">Shell-and-Tube</option>
                    <option value="double-pipe">Double-Pipe</option>
                    <option value="plate-and-frame">Plate-and-Frame</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Fluid State
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="font-semibold mb-2">Fluid State on High-Pressure Side:</div>
                          <div className="space-y-2 text-sm">
                            <div><strong>Liquid:</strong> Non-flashing liquid (stays liquid at low-pressure side conditions)</div>
                            <div><strong>Gas:</strong> Vapor or gas on high-pressure side</div>
                            <div><strong>Flashing Liquid:</strong> Liquid that flashes to vapor when pressure drops (two-phase flow)</div>
                          </div>
                          <div className="text-xs mt-2 pt-2 border-t border-gray-600">
                            For volatile fluids being heated, consider flashing effects.
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <select
                    value={flowData.fluidState}
                    onChange={(e) => updateFlowData('fluidState', e.target.value)}
                    disabled={!isSelected}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="liquid">Liquid (Non-flashing)</option>
                    <option value="gas">Gas/Vapor</option>
                    <option value="flashing-liquid">Flashing Liquid</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      High-Pressure Side (psig)
                    </label>
                    <Tooltip 
                      className="w-80"
                      content="Maximum operating pressure on the high-pressure side of the exchanger. If substantially different from design pressure, the maximum possible system pressure may be used."
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.highPressureSide || ''}
                    onChange={(e) => updateFlowData('highPressureSide', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 600"
                  />
                  {hasValidInputs && previewValues.pressureDifferential > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ΔP = {previewValues.pressureDifferential.toFixed(1)} psi above vessel MAWP
                    </p>
                  )}
                  {hasValidInputs && previewValues.pressureDifferential <= 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Below vessel MAWP ({vesselData.vesselDesignMawp} psig)
                    </p>
                  )}
                </div>
              </div>

              {/* Tube Properties */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tube Inner Diameter (in)
                    </label>
                    <Tooltip 
                      className="w-80"
                      content="Inner diameter of the tube. Common sizes: 0.62 in (5/8″), 0.75 in (3/4″), 1.0 in. Per API-521, assume guillotine break of one tube at tubesheet."
                    />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={flowData.tubeInnerDiameter || ''}
                    onChange={(e) => updateFlowData('tubeInnerDiameter', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="0.75"
                  />
                  <p className="text-xs text-gray-500 mt-1">Typical: 0.62, 0.75, 1.0</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Tubes Failed
                    </label>
                    <Tooltip 
                      className="w-80"
                      content="Number of tubes assumed to fail simultaneously. API-521 typically assumes single tube failure unless analysis indicates otherwise."
                    />
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={flowData.numberOfTubes || ''}
                    onChange={(e) => updateFlowData('numberOfTubes', parseInt(e.target.value) || 1)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                  />
                  <p className="text-xs text-gray-500 mt-1">Typically 1</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Temperature (°F)
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Fluid temperature at high-pressure side"
                    />
                  </div>
                  <input
                    type="number"
                    step="1"
                    value={flowData.temperatureF || ''}
                    onChange={(e) => updateFlowData('temperatureF', parseFloat(e.target.value) || 80)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                  />
                </div>

                {previewValues.tubeFlowArea > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tube Flow Area
                    </label>
                    <div className="h-10 px-3 py-2 bg-blue-50 border border-gray-300 rounded-md flex items-center">
                      <span className="text-gray-900">
                        {(previewValues.tubeFlowArea * 144).toFixed(4)} in²
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(previewValues.tubeFlowArea * 1000000).toFixed(2)} ft² × 10⁶
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Fluid Properties */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Fluid Properties</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(flowData.fluidState === 'liquid' || flowData.fluidState === 'flashing-liquid') && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Fluid Density (lb/ft³)
                      </label>
                      <Tooltip 
                        className="w-80"
                        content="Liquid density at operating conditions. Water ≈ 62.4 lb/ft³, typical hydrocarbons 30-60 lb/ft³."
                      />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={flowData.fluidDensity || ''}
                      onChange={(e) => updateFlowData('fluidDensity', parseFloat(e.target.value) || 0)}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      disabled={!isSelected}
                      placeholder="62.4"
                    />
                    <p className="text-xs text-gray-500 mt-1">Water: 62.4 lb/ft³</p>
                  </div>
                )}

                {flowData.fluidState === 'gas' && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Molecular Weight
                        </label>
                        <Tooltip 
                          className="w-80"
                          content="Molecular weight of gas. Air = 29, N₂ = 28, CH₄ = 16, H₂ = 2"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={flowData.molecularWeight || ''}
                        onChange={(e) => updateFlowData('molecularWeight', parseFloat(e.target.value) || 28)}
                        className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                          !isSelected 
                            ? 'border-gray-200 bg-gray-50 text-gray-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        disabled={!isSelected}
                        placeholder="28"
                      />
                      <p className="text-xs text-gray-500 mt-1">lb/lbmol</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Specific Heat Ratio (k)
                        </label>
                        <Tooltip 
                          className="w-80"
                          content="Ratio of specific heats Cp/Cv. Air/N₂ ≈ 1.4, steam ≈ 1.3, CO₂ ≈ 1.3"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={flowData.specificHeatRatio || ''}
                        onChange={(e) => updateFlowData('specificHeatRatio', parseFloat(e.target.value) || 1.4)}
                        className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                          !isSelected 
                            ? 'border-gray-200 bg-gray-50 text-gray-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        disabled={!isSelected}
                        placeholder="1.4"
                      />
                      <p className="text-xs text-gray-500 mt-1">Cp/Cv</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Relief Requirement Assessment */}
            {hasValidInputs && (
              <div className={`p-4 rounded-lg border-2 ${
                previewValues.reliefRequired 
                  ? 'bg-yellow-50 border-yellow-300' 
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    previewValues.reliefRequired ? 'bg-yellow-400' : 'bg-green-400'
                  }`}>
                    {previewValues.reliefRequired ? (
                      <span className="text-white font-bold text-sm">!</span>
                    ) : (
                      <span className="text-white font-bold text-sm">✓</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold mb-1 ${
                      previewValues.reliefRequired ? 'text-yellow-900' : 'text-green-900'
                    }`}>
                      {previewValues.reliefRequired ? 'Relief Protection Required' : 'Relief May Not Be Required'}
                    </h3>
                    <p className={`text-sm ${
                      previewValues.reliefRequired ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      {previewValues.reliefRequired ? (
                        <>Per API-521 Section 4.4.14.2.1, the high-pressure side ({flowData.highPressureSide} psig) exceeds the low-pressure side design pressure ({vesselData.vesselDesignMawp} psig). Relief protection is required unless a detailed mechanical analysis shows loss of containment is unlikely.</>
                      ) : (
                        <>Per API-521 Section 4.4.14.2.1, the high-pressure side pressure ({flowData.highPressureSide} psig) does not exceed the low-pressure side design pressure ({vesselData.vesselDesignMawp} psig). Relief protection may not be required. However, verify that overpressure would not exceed the corrected hydrotest pressure.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Calculated Results */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Calculated Results</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Single Tube Flow
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Flow rate through one ruptured tube"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-medium text-gray-700">
                      {hasValidInputs && previewValues.singleTubeFlow > 0
                        ? `${Math.round(previewValues.singleTubeFlow).toLocaleString()} lb/hr` 
                        : '—'
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Total Flow ({flowData.numberOfTubes} tube{flowData.numberOfTubes > 1 ? 's' : ''})
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Total flow for all failed tubes"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-medium text-gray-700">
                      {hasValidInputs && previewValues.totalTubeFlow > 0
                        ? `${Math.round(previewValues.totalTubeFlow).toLocaleString()} lb/hr` 
                        : '—'
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Net Relieving Flow
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Required relief flow at relieving conditions"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-medium text-gray-700">
                      {hasValidInputs && previewValues.calculatedRelievingFlow > 0
                        ? `${Math.round(previewValues.calculatedRelievingFlow).toLocaleString()} lb/hr` 
                        : '—'
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      ASME VIII Design Flow
                    </label>
                    <Tooltip 
                      className="w-64"
                      content="Relief flow with ASME VIII safety factor (÷0.9 for 110% accumulation)"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-bold text-gray-700">
                      {hasValidInputs && previewValues.asmeVIIIDesignFlow > 0
                        ? `${previewValues.asmeVIIIDesignFlow.toLocaleString()} lb/hr` 
                        : '—'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {flowData.fluidState === 'flashing-liquid' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Flashing liquid calculations use simplified methodology. For accurate sizing of two-phase relief scenarios, use DIERS methodology (HEM model) or consult API-521 Section 4.4.14.2.2 for detailed guidance.
                  </p>
                </div>
              )}

              {flowData.highPressureSide - vesselData.vesselDesignMawp > 1000 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm text-amber-800">
                    <strong>High Pressure Differential Detected (&gt;1000 psi):</strong> API-521 Section 4.4.14.2.2 recommends dynamic analysis in addition to steady-state approach. Transient overpressure may exceed test pressure even with PRD protection.
                  </p>
                </div>
              )}
            </div>
          </div>

          {!isSelected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> This case is not currently selected for design basis flow calculation. 
                Toggle &quot;Include Case&quot; above to include it in your analysis.
              </p>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  )
}

