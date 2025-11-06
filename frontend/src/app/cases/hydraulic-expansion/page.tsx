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

interface FlowData {
  workingFluid: string
  scenarioType: 'cold-fluid-shutin' | 'exchanger-blocked-in' | 'solar-heating' | 'heat-tracing' | 'other'
  heatInputRate: number // Heat transfer rate (Btu/h)
  cubicExpansionCoefficient: number // αv (1/°F) - typically 0.0001 to 0.0010 for hydrocarbons
  specificHeatCapacity: number // c (Btu/lb·°F) - typically 0.4 to 0.6 for hydrocarbons
  relativeDensity: number // d (dimensionless, relative to water at 60°F) - typically 0.5 to 0.9
  trappedVolume: number // Volume of trapped liquid (gallons)
}

export default function HydraulicExpansionCase() {
  const { vesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const designBasisFlow = getDesignBasisFlow()
  const isSelected = selectedCases['hydraulic-expansion']

  useScrollPosition()

  // Use custom hook for automatic localStorage sync
  const [flowData, setFlowData] = useLocalStorage<FlowData>(STORAGE_KEYS.HYDRAULIC_EXPANSION_FLOW, {
    workingFluid: '',
    scenarioType: 'cold-fluid-shutin',
    heatInputRate: 0,
    cubicExpansionCoefficient: 0.0005, // Typical value for hydrocarbons
    specificHeatCapacity: 0.5, // Typical value for hydrocarbons
    relativeDensity: 0.7, // Typical value for hydrocarbons
    trappedVolume: 0
  })

  const [pressureData, setPressureData] = useLocalStorage<CasePressureData>(STORAGE_KEYS.HYDRAULIC_EXPANSION_PRESSURE, {
    maxAllowedVentingPressure: 0,
    maxAllowableBackpressure: 0,
    maxAllowedVentingPressurePercent: 110
  })

  const updateFlowData = (field: keyof FlowData, value: string | number) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }

  const updatePressureData = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate preview values using API-521 Equation (2) - USC units
  // q = (αv × φ) / (d × c × 500)
  // where q is in gpm, φ is in Btu/h, αv is in 1/°F, d is dimensionless, c is in Btu/lb·°F
  const previewValues = React.useMemo(() => {
    const hasValidInputs = 
      flowData.heatInputRate > 0 &&
      flowData.cubicExpansionCoefficient > 0 &&
      flowData.specificHeatCapacity > 0 &&
      flowData.relativeDensity > 0

    if (!hasValidInputs) {
      return {
        volumetricFlowRate: 0,
        massFlowRate: 0,
        calculatedRelievingFlow: 0,
        asmeVIIIDesignFlow: 0,
        reliefTimeEstimate: 0
      }
    }

    // API-521 Equation (2) for USC units
    // q (gpm) = (αv × φ) / (d × c × 500)
    const volumetricFlowRate = 
      (flowData.cubicExpansionCoefficient * flowData.heatInputRate) / 
      (flowData.relativeDensity * flowData.specificHeatCapacity * 500)

    // Convert volumetric flow to mass flow
    // Mass flow (lb/hr) = volumetric flow (gpm) × density (lb/gal) × 60 (min/hr)
    // Water density = 8.34 lb/gal, so fluid density = 8.34 × relativeDensity
    const fluidDensity = 8.34 * flowData.relativeDensity // lb/gal
    const massFlowRate = volumetricFlowRate * fluidDensity * 60 // lb/hr

    const calculatedRelievingFlow = massFlowRate
    
    // ASME VIII Design Flow accounts for 110% accumulation (divide by 0.9)
    const asmeVIIIDesignFlow = calculatedRelievingFlow > 0 
      ? Math.round(calculatedRelievingFlow / 0.9) 
      : 0

    // Estimate time to relieve trapped volume (if specified)
    // Time (minutes) = Volume (gallons) / Flow Rate (gpm)
    const reliefTimeEstimate = (flowData.trappedVolume > 0 && volumetricFlowRate > 0)
      ? flowData.trappedVolume / volumetricFlowRate
      : 0

    return {
      volumetricFlowRate,
      massFlowRate,
      calculatedRelievingFlow,
      asmeVIIIDesignFlow,
      reliefTimeEstimate
    }
  }, [
    flowData.heatInputRate,
    flowData.cubicExpansionCoefficient,
    flowData.specificHeatCapacity,
    flowData.relativeDensity,
    flowData.trappedVolume
  ])

  const hasValidInputs = 
    flowData.heatInputRate > 0 &&
    flowData.cubicExpansionCoefficient > 0 &&
    flowData.specificHeatCapacity > 0 &&
    flowData.relativeDensity > 0

  // Auto-update case results when calculations change (using standardized hook)
  useCaseCalculation({
    caseId: 'hydraulic-expansion',
    previewValues,
    flowData,
    updateCaseResult,
    storageKey: STORAGE_KEYS.HYDRAULIC_EXPANSION_FLOW
  })

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />
        
        {/* Reusable Design Basis Flow Banner */}
        <DesignBasisFlowBanner designBasisFlow={designBasisFlow} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 mobile-pt-0">
          {/* Reusable Page Header with breadcrumb, title, about section, and toggle */}
          <CasePageHeader
            caseName="Hydraulic Expansion"
            title="Hydraulic Expansion (Thermal Expansion)"
            isSelected={isSelected}
            onToggle={() => toggleCase('hydraulic-expansion')}
            aboutContent={
              <>
                <p>
                  <strong>Hydraulic expansion</strong> (also called thermal expansion) occurs when liquid-filled piping or vessels are blocked in and subsequently heated, causing the liquid to expand. Since liquids are nearly incompressible, even small temperature increases can generate extremely high pressures when the liquid has no room to expand.
                </p>
                <p>
                  This scenario is particularly critical because the pressure rise can be rapid and can easily exceed the design pressure of equipment. Common causes include blocked-in heat exchangers, solar heating of piping, heat tracing on isolated sections, and ambient temperature changes on cold liquid systems.
                </p>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">API-521 Section 4.4.12: Hydraulic Expansion</p>
                  <p>
                    Per API-521 Section 4.4.12, key considerations include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Cold-Fluid Shut-In:</strong> Piping or vessels blocked in while filled with cold liquid and subsequently heated by heat tracing, coils, ambient heat gain, or fire</li>
                    <li><strong>Blocked-In Exchanger:</strong> Heat exchanger blocked in on the cold side with flow continuing on the hot side</li>
                    <li><strong>Solar Heating:</strong> Piping or vessels blocked in at near-ambient temperatures and heated by direct solar radiation</li>
                    <li><strong>Relief Device Sizing:</strong> Required relieving rate can be calculated using Equation (2) in API-521 Section 4.4.12.3</li>
                    <li><strong>Administrative Controls:</strong> In certain installations (e.g., cooling circuits with locked-open valves), hydraulic expansion relief devices may not be required if proper procedures are in place</li>
                    <li><strong>Set Pressure:</strong> PRD should be set high enough to open only under hydraulic expansion conditions, never above the design rating of the weakest component</li>
                  </ul>
                </div>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">Calculation Method (API-521 Equation 2)</p>
                  <p>
                    The required relieving rate for liquid-full systems is calculated using the following equation (USC units):
                  </p>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 font-mono text-sm">
                    q = (αᵥ × φ) / (d × c × 500)
                  </div>
                  <p className="text-sm">
                    Where:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li><strong>q</strong> = Volume flow rate at flowing temperature (gpm)</li>
                    <li><strong>αᵥ</strong> = Cubic expansion coefficient for the liquid (1/°F)</li>
                    <li><strong>φ</strong> = Total heat transfer rate (Btu/h)</li>
                    <li><strong>d</strong> = Relative density referred to water (d = 1.00 at 60°F), dimensionless</li>
                    <li><strong>c</strong> = Specific heat capacity of the trapped fluid (Btu/lb·°F)</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Typical values for hydrocarbons: αᵥ = 0.0005 to 0.001 (1/°F), c = 0.4 to 0.6 (Btu/lb·°F), d = 0.5 to 0.9
                  </p>
                </div>
                
                <p className="text-xs text-gray-600 border-t border-blue-200 pt-2">
                  <strong>Note:</strong> The ASME VIII design flow includes a 1/0.9 multiplier per ASME Section VIII requirements for liquid relief sizing, accounting for the 110% accumulation allowance. For heat exchangers, the maximum exchanger duty during operation should be used. If fluid properties vary significantly with temperature, use worst-case values.
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
              caseName="Hydraulic Expansion"
              isAutoCalculated={true}
              vesselMawp={vesselData.vesselDesignMawp}
              mawpPercent={110}
              disabled={!isSelected}
            />

            {/* Flow Calculations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
              <p className="text-sm text-gray-600 mb-4">
                Calculate the required relief flow rate for hydraulic expansion using API-521 Equation (2). Enter the heat input rate and fluid properties for the blocked-in liquid system.
              </p>
              
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
                    required
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
                      Scenario Type
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="font-semibold mb-2">Select the hydraulic expansion scenario:</div>
                          <div className="space-y-2 text-sm">
                            <div><strong>Cold-Fluid Shut-In:</strong> Blocked-in liquid heated by ambient, heat tracing, or coils</div>
                            <div><strong>Exchanger Blocked-In:</strong> Heat exchanger with cold side blocked and hot side flowing</div>
                            <div><strong>Solar Heating:</strong> Piping or vessels blocked in and heated by direct solar radiation</div>
                            <div><strong>Heat Tracing:</strong> Traced piping or equipment blocked in during operation</div>
                            <div><strong>Other:</strong> Other sources of heat input to blocked-in liquid</div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <select
                    value={flowData.scenarioType}
                    onChange={(e) => updateFlowData('scenarioType', e.target.value)}
                    disabled={!isSelected}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="cold-fluid-shutin">Cold-Fluid Shut-In</option>
                    <option value="exchanger-blocked-in">Exchanger Blocked-In</option>
                    <option value="solar-heating">Solar Heating</option>
                    <option value="heat-tracing">Heat Tracing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Heat Input Rate, φ (Btu/h)
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="mb-2">Total heat transfer rate to the blocked-in liquid:</div>
                          <div className="text-sm space-y-1">
                            <div><strong>Heat Exchanger:</strong> Maximum exchanger duty during operation</div>
                            <div><strong>Heat Tracing:</strong> Total heat tracing capacity (watts × 3.412 to convert to Btu/h)</div>
                            <div><strong>Solar Heating:</strong> Solar heat flux × exposed surface area (typically 250-300 Btu/h·ft² for direct sun)</div>
                            <div><strong>Ambient Heating:</strong> Estimate based on temperature difference and heat transfer coefficient</div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <input
                    type="number"
                    step="1"
                    value={flowData.heatInputRate || ''}
                    onChange={(e) => updateFlowData('heatInputRate', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 50000"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Cubic Expansion Coeff., αᵥ (1/°F)
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="mb-2">Cubic (volumetric) expansion coefficient of the liquid at expected temperature.</div>
                          <div className="text-sm space-y-1">
                            <div><strong>Typical Values at 60°F:</strong></div>
                            <div>• Light hydrocarbons: 0.0008 to 0.0010 (1/°F)</div>
                            <div>• Medium hydrocarbons: 0.0005 to 0.0008 (1/°F)</div>
                            <div>• Heavy hydrocarbons: 0.0003 to 0.0005 (1/°F)</div>
                            <div>• Water: 0.0001 (1/°F)</div>
                          </div>
                          <div className="text-xs mt-2 pt-2 border-t border-gray-600">
                            <strong>Note:</strong> This value is best obtained from process design data. Per API-521, the coefficient varies with temperature, so use values appropriate for the expected operating temperature. If unavailable, use API-521 Table 2 or estimate from density-temperature data using Equation (4).
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={flowData.cubicExpansionCoefficient || ''}
                    onChange={(e) => updateFlowData('cubicExpansionCoefficient', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 0.0005"
                    required
                  />
                </div>
              </div>

              {/* Second row of inputs */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Specific Heat, c (Btu/lb·°F)
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="mb-2">Specific heat capacity of the trapped fluid.</div>
                          <div className="text-sm space-y-1">
                            <div><strong>Typical Values at 60°F:</strong></div>
                            <div>• Light hydrocarbons: 0.5 to 0.6 (Btu/lb·°F)</div>
                            <div>• Medium hydrocarbons: 0.45 to 0.55 (Btu/lb·°F)</div>
                            <div>• Heavy hydrocarbons: 0.4 to 0.5 (Btu/lb·°F)</div>
                            <div>• Water: 1.0 (Btu/lb·°F)</div>
                          </div>
                          <div className="text-xs mt-2 pt-2 border-t border-gray-600">
                            <strong>Note:</strong> This value is best obtained from process design data or fluid property databases. Specific heat varies with temperature, so use values appropriate for the expected operating temperature range.
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={flowData.specificHeatCapacity || ''}
                    onChange={(e) => updateFlowData('specificHeatCapacity', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 0.5"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Relative Density, d
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="mb-2">Relative density referred to water at 60°F (d = 1.00 for water), dimensionless. Also known as specific gravity for liquids.</div>
                          <div className="text-sm space-y-1">
                            <div><strong>Typical Values:</strong></div>
                            <div>• Light hydrocarbons (gasoline, naphtha): 0.65 to 0.75</div>
                            <div>• Medium hydrocarbons (kerosene, diesel): 0.75 to 0.85</div>
                            <div>• Heavy hydrocarbons (fuel oil): 0.85 to 0.95</div>
                            <div>• Water: 1.00</div>
                          </div>
                          <div className="text-xs mt-2 pt-2 border-t border-gray-600">
                            Per API-521, compressibility of the liquid is usually ignored. Do not confuse with absolute density (lb/ft³ or kg/m³).
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={flowData.relativeDensity || ''}
                    onChange={(e) => updateFlowData('relativeDensity', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 0.7"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Trapped Volume (gal) [Optional]
                    </label>
                    <Tooltip 
                      className="w-80"
                      content={
                        <div>
                          <div className="mb-2">Volume of trapped liquid in the blocked-in system (optional for reference).</div>
                          <div className="text-sm">
                            If specified, an estimate of the time to relieve the trapped volume will be calculated. This is for reference only and does not affect the required relief flow rate.
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.trappedVolume || ''}
                    onChange={(e) => updateFlowData('trappedVolume', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              {/* Important Warning */}
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">!</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                      Important: Hydraulic Expansion Protection
                    </h3>
                    <p className="text-sm text-yellow-800">
                      Per API-521 Section 4.4.12, hydraulic expansion can generate extremely high pressures rapidly. Even small temperature increases can cause overpressure. The PRD set pressure should be high enough to open only under hydraulic expansion conditions, but never above the design rating of the weakest component in the blocked-in system. Consider administrative controls (locked-open valves, procedures) as alternatives to PRDs where appropriate.
                    </p>
                  </div>
                </div>
              </div>

              {/* Calculated values preview */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Calculated Results</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Volumetric Flow Rate
                      </label>
                      <Tooltip 
                        className="min-w-max"
                        content="Required relief flow rate at flowing temperature (gpm)"
                      />
                    </div>
                    <div className="bg-blue-50 p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        {hasValidInputs && previewValues.volumetricFlowRate > 0
                          ? `${previewValues.volumetricFlowRate.toFixed(2)} gpm` 
                          : '—'
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Mass Flow Rate
                      </label>
                      <Tooltip 
                        className="min-w-max"
                        content="Volumetric flow converted to mass flow (lb/hr)"
                      />
                    </div>
                    <div className="bg-blue-50 p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        {hasValidInputs && previewValues.massFlowRate > 0
                          ? `${Math.round(previewValues.massFlowRate).toLocaleString()} lb/hr` 
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
                        content="Mass flow rate ÷ 0.9 per ASME Section VIII for liquid relief sizing (110% accumulation allowance)"
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

                  {flowData.trappedVolume > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Relief Time Estimate
                        </label>
                        <Tooltip 
                          className="w-64"
                          content="Estimated time to relieve the trapped volume at calculated flow rate (reference only)"
                        />
                      </div>
                      <div className="bg-blue-50 p-3 rounded border">
                        <div className="font-medium text-gray-700">
                          {hasValidInputs && previewValues.reliefTimeEstimate > 0
                            ? `${previewValues.reliefTimeEstimate.toFixed(1)} min` 
                            : '—'
                          }
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>

          {/* Case Selection Status */}
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

