'use client'

import React from 'react'
import CollapsibleVesselProperties from '../../components/CollapsibleVesselProperties'
import CasePressureSettings from '../../components/CasePressureSettings'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import Tooltip from '../../components/Tooltip'
import DesignBasisFlowBanner from '../../components/DesignBasisFlowBanner'
import CasePageHeader from '../../components/CasePageHeader'
import ResetCaseFields from '../../components/ResetCaseFields'
import { useVessel } from '../../context/VesselContext'
import { useCase } from '../../context/CaseContext'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useCaseCalculation } from '../../hooks/useCaseCalculation'
import { CasePressureData, STORAGE_KEYS } from '../../types/case-types'
import { getFluidNames } from '../../../../lib/database'

interface FlowData {
  workingFluid: string
  failureMode: 'total-condensing' | 'partial-condensing' | 'air-cooler-fan' | 'pump-around'
  
  // Common inputs
  incomingVaporRate: number // lb/hr - vapor rate to condenser at normal conditions
  operatingTemperature: number // °F
  operatingPressure: number // psig
  
  // Partial condensing specific
  outgoingVaporRate: number // lb/hr - vapor leaving condenser (for partial condensing)
  
  // Air cooler specific
  naturalConvectionCredit: number // % - typically 20-30%
  
  // Pump-around specific
  pumpAroundHeatDuty: number // BTU/hr - heat removed by pump-around circuit
  latentHeatOfVaporization: number // BTU/lb - at relieving conditions
  
  // Calculated at relieving conditions
  reliefTemperature: number // °F - temperature at relief pressure
  vaporDensityRelief: number // lb/ft³ - vapor density at relief conditions
}

export default function CoolingRefluxFailurePage() {
  const { vesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const designBasisFlow = getDesignBasisFlow()
  const isSelected = selectedCases['cooling-reflux-failure']

  useScrollPosition()

  const [flowData, setFlowData] = useLocalStorage<FlowData>(STORAGE_KEYS.COOLING_REFLUX_FAILURE_FLOW, {
    workingFluid: '',
    failureMode: 'total-condensing',
    incomingVaporRate: 0,
    operatingTemperature: 0,
    operatingPressure: 0,
    outgoingVaporRate: 0,
    naturalConvectionCredit: 25,
    pumpAroundHeatDuty: 0,
    latentHeatOfVaporization: 0,
    reliefTemperature: 0,
    vaporDensityRelief: 0
  })

  const [pressureData, setPressureData] = useLocalStorage<CasePressureData>(
    STORAGE_KEYS.COOLING_REFLUX_FAILURE_PRESSURE,
    {
      maxAllowedVentingPressure: 0,
      maxAllowableBackpressure: 0,
      maxAllowedVentingPressurePercent: 116 // Gas/vapor relief typically 116% for single PRD
    }
  )

  const updateFlowData = (field: keyof FlowData, value: string | number) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }

  const updatePressureData = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Reset all case-specific fields to defaults
  const handleResetFields = () => {
    // Clear localStorage completely
    localStorage.removeItem(STORAGE_KEYS.COOLING_REFLUX_FAILURE_FLOW)
    localStorage.removeItem(STORAGE_KEYS.COOLING_REFLUX_FAILURE_PRESSURE)
    
    // Reset state to defaults
    setFlowData({
      workingFluid: '',
      failureMode: 'total-condensing',
      incomingVaporRate: 0,
      operatingTemperature: 0,
      operatingPressure: 0,
      outgoingVaporRate: 0,
      naturalConvectionCredit: 25,
      pumpAroundHeatDuty: 0,
      latentHeatOfVaporization: 0,
      reliefTemperature: 0,
      vaporDensityRelief: 0
    })
    setPressureData({
      maxAllowedVentingPressure: 0,
      maxAllowableBackpressure: 0,
      maxAllowedVentingPressurePercent: 116
    })
  }

  // Calculate preview values based on failure mode
  const previewValues = React.useMemo(() => {
    let calculatedRelievingFlow = 0
    
    // Validate required inputs based on failure mode
    const hasValidBaseInputs = flowData.incomingVaporRate > 0 && flowData.workingFluid

    if (!hasValidBaseInputs) {
      return {
        calculatedRelievingFlow: 0,
        asmeVIIIDesignFlow: 0,
        description: 'Enter required inputs'
      }
    }

    switch (flowData.failureMode) {
      case 'total-condensing':
        // API-521 4.4.3.2.2: Total incoming vapor rate at relieving conditions
        // User must input vapor rate already calculated at relief pressure/temperature
        // (requires process simulation or VLE calculations)
        calculatedRelievingFlow = flowData.incomingVaporRate
        break

      case 'partial-condensing':
        // API-521 4.4.3.2.3: Difference between incoming and outgoing vapor at relief conditions
        // Both rates must be determined at relief pressure/temperature by user
        if (flowData.outgoingVaporRate >= 0) {
          calculatedRelievingFlow = Math.max(0, flowData.incomingVaporRate - flowData.outgoingVaporRate)
        }
        break

      case 'air-cooler-fan':
        // API-521 4.4.3.2.4: Credit for 20-30% natural convection
        // Relief based on 70-80% of duty (remaining after natural convection credit)
        // User must input vapor rate at relief conditions
        const convectionCredit = Math.max(0, Math.min(100, flowData.naturalConvectionCredit))
        const reliefPercentage = 100 - convectionCredit
        calculatedRelievingFlow = flowData.incomingVaporRate * (reliefPercentage / 100)
        break

      case 'pump-around':
        // API-521 4.4.3.2.7: Vaporization rate from heat duty
        if (flowData.pumpAroundHeatDuty > 0 && flowData.latentHeatOfVaporization > 0) {
          calculatedRelievingFlow = flowData.pumpAroundHeatDuty / flowData.latentHeatOfVaporization
        }
        break
    }

    // ASME VIII Design Flow for vapor/gas relief
    // Using 1/0.9 factor for consistency (though gas relief may use different factors)
    const asmeVIIIDesignFlow = calculatedRelievingFlow > 0 
      ? Math.round(calculatedRelievingFlow / 0.9) 
      : 0

    return {
      calculatedRelievingFlow: Math.round(calculatedRelievingFlow),
      asmeVIIIDesignFlow,
      description: getFailureModeDescription(flowData.failureMode)
    }
  }, [
    flowData.failureMode,
    flowData.incomingVaporRate,
    flowData.outgoingVaporRate,
    flowData.naturalConvectionCredit,
    flowData.pumpAroundHeatDuty,
    flowData.latentHeatOfVaporization,
    flowData.workingFluid
  ])

  const hasValidInputs = flowData.workingFluid && flowData.incomingVaporRate > 0

  // Auto-update case results when calculations change
  useCaseCalculation({
    caseId: 'cooling-reflux-failure',
    previewValues,
    flowData,
    updateCaseResult,
    storageKey: STORAGE_KEYS.COOLING_REFLUX_FAILURE_FLOW
  })

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />
        
        <DesignBasisFlowBanner designBasisFlow={designBasisFlow} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 mobile-pt-0">
          <CasePageHeader
            caseName="Cooling/Reflux Failure"
            title="Cooling or Reflux Failure (Loss of Condenser)"
            isSelected={isSelected}
            onToggle={() => toggleCase('cooling-reflux-failure')}
            aboutContent={
              <>
                <p>
                  <strong>Cooling or reflux failure</strong> occurs when electrical or mechanical equipment providing cooling or condensation in process streams fails, causing overpressure in process vessels. This includes condenser failures, loss of reflux from pump or instrument failure, cooling tower or air-cooler fan failures, and pump-around circuit failures.
                </p>
                <p>
                  Common causes include power failures, pump mechanical failures, cooling water supply interruptions, air-cooler fan failures, control valve failures, and fouling that reduces heat transfer effectiveness. The loss of cooling can cause rapid pressure buildup as vapors are no longer condensed.
                </p>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">API-521 Section 4.4.3: Cooling or Reflux Failure</p>
                  <p>
                    Per API-521 Section 4.4.3, the required relieving rate is determined by a heat and material balance at the relieving pressure. Several simplified calculation methods are accepted:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Total Condensing (4.4.3.2.2):</strong> Required relief is the total incoming vapor rate to the condenser, recalculated at relieving conditions</li>
                    <li><strong>Partial Condensing (4.4.3.2.3):</strong> Required relief is the difference between incoming and outgoing vapor rates at relieving conditions</li>
                    <li><strong>Air Cooler Fan Failure (4.4.3.2.4):</strong> Credit for 20-30% natural convection capacity; relief based on remaining 70-80% of duty</li>
                    <li><strong>Pump-around Circuit (4.4.3.2.7):</strong> Required relief is the vaporization rate caused by heat normally removed in the pump-around circuit</li>
                    <li><strong>Overhead Circuit:</strong> Loss of reflux (pump failure, valve closure) can cause condenser flooding equivalent to total cooling loss</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Credit is normally not taken for residual coolant after cooling stream fails (time-limited effect). However, if process piping is unusually large and bare, heat loss to surroundings may be considered.
                  </p>
                </div>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">Calculation Method</p>
                  <p>
                    Select the failure mode that matches your system configuration. <strong className="text-amber-700">All vapor rates must be determined at relieving conditions (relief pressure and temperature), not at normal operating conditions.</strong> This typically requires process simulation software (HYSYS, PRO/II, UniSim) or rigorous heat/material balance calculations with vapor-liquid equilibrium (VLE) to account for composition and property changes at the higher pressure.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Per API-521 Section 4.4.3.2.1, vapor rates must be &quot;recalculated at a temperature that corresponds to the new vapor composition at relieving conditions.&quot; This calculator performs the final flow rate determination once you have determined the vapor rates at relieving conditions from your process simulation or hand calculations.
                  </p>
                </div>
                
                <p className="text-xs text-gray-600 border-t border-blue-200 pt-2">
                  <strong>Note:</strong> The ASME VIII design flow includes appropriate safety factors per ASME Section VIII requirements for vapor/gas relief sizing. For systems with multiple cooling stages or complex reflux arrangements, evaluate each failure mode independently.
                </p>
              </>
            }
            rightControls={
              <ResetCaseFields 
                onReset={handleResetFields}
                caseName="Cooling/Reflux Failure"
                disabled={!isSelected}
              />
            }
          />

          <div className={`space-y-8 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
            <CollapsibleVesselProperties />

            <CasePressureSettings
              pressureData={pressureData}
              onChange={updatePressureData}
              caseName="Cooling/Reflux Failure"
              isAutoCalculated={true}
              vesselMawp={vesselData.vesselDesignMawp}
              mawpPercent={116}
              disabled={!isSelected}
            />

            {/* Flow Calculations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select the failure mode and enter system parameters. The calculator will determine the required relieving rate based on API-521 Section 4.4.3 guidance.
              </p>
              
              {/* Basic Inputs */}
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
                      Failure Mode
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="font-semibold mb-2">Select the cooling/reflux failure scenario:</div>
                          <div className="space-y-2 text-sm">
                            <div><strong>Total Condensing:</strong> Complete loss of cooling - relief all incoming vapor</div>
                            <div><strong>Partial Condensing:</strong> Partial cooling loss - relief net vapor not condensed</div>
                            <div><strong>Air Cooler Fan Failure:</strong> Fan stops but natural convection provides 20-30% cooling</div>
                            <div><strong>Pump-around Circuit:</strong> Circulating pump fails - relief vaporization from lost heat removal</div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <select
                    value={flowData.failureMode}
                    onChange={(e) => updateFlowData('failureMode', e.target.value)}
                    disabled={!isSelected}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="total-condensing">Total Condensing</option>
                    <option value="partial-condensing">Partial Condensing</option>
                    <option value="air-cooler-fan">Air Cooler Fan Failure</option>
                    <option value="pump-around">Pump-around Circuit</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Incoming Vapor Rate at Relief (lb/hr)
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <p className="mb-2">Vapor rate entering the condenser at <strong>relieving conditions</strong> (relief pressure and temperature).</p>
                          <p className="text-sm">Per API-521 Section 4.4.3.2.2, this must be recalculated at the new vapor composition and temperature corresponding to the relief pressure. This typically requires process simulation (HYSYS, PRO/II, UniSim) or rigorous heat/material balance with VLE calculations.</p>
                        </div>
                      }
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.incomingVaporRate || ''}
                    onChange={(e) => updateFlowData('incomingVaporRate', parseFloat(e.target.value) || 0)}
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
                      Relief Temperature (°F)
                    </label>
                    <Tooltip 
                      className="w-80"
                      content="Temperature at relief conditions (corresponding to relief pressure). Used for documentation and reference only."
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.operatingTemperature || ''}
                    onChange={(e) => updateFlowData('operatingTemperature', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 250"
                  />
                </div>
              </div>

              {/* Mode-specific inputs */}
              {flowData.failureMode === 'partial-condensing' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Outgoing Vapor Rate at Relief (lb/hr)
                      </label>
                      <Tooltip 
                        className="w-96"
                        content={
                          <div>
                            <p className="mb-2">Vapor rate leaving the condenser (not condensed) at <strong>relieving conditions</strong>.</p>
                            <p className="text-sm">Per API-521 Section 4.4.3.2.3, the required relieving rate is the difference between incoming and outgoing vapor rates at relieving conditions. Both rates must be determined at relief pressure/temperature.</p>
                          </div>
                        }
                      />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={flowData.outgoingVaporRate || ''}
                      onChange={(e) => updateFlowData('outgoingVaporRate', parseFloat(e.target.value) || 0)}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      disabled={!isSelected}
                      placeholder="e.g., 10000"
                    />
                  </div>
                </div>
              )}

              {flowData.failureMode === 'air-cooler-fan' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Natural Convection Credit (%)
                      </label>
                      <Tooltip 
                        className="w-96"
                        content={
                          <div>
                            <p className="mb-2">Percentage of normal cooling duty available through natural convection when fan stops.</p>
                            <p className="text-sm">Per API-521 Section 4.4.3.2.4, typical credit is 20-30% unless determined otherwise by engineering analysis. Relief is sized for the remaining 70-80%.</p>
                          </div>
                        }
                      />
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={flowData.naturalConvectionCredit || ''}
                      onChange={(e) => updateFlowData('naturalConvectionCredit', parseFloat(e.target.value) || 0)}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      disabled={!isSelected}
                      placeholder="e.g., 25"
                    />
                  </div>
                </div>
              )}

              {flowData.failureMode === 'pump-around' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Pump-around Heat Duty (BTU/hr)
                      </label>
                      <Tooltip 
                        className="w-96"
                        content="Heat removed by the pump-around circuit at normal operation. This heat will cause vaporization when the pump fails."
                      />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={flowData.pumpAroundHeatDuty || ''}
                      onChange={(e) => updateFlowData('pumpAroundHeatDuty', parseFloat(e.target.value) || 0)}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      disabled={!isSelected}
                      placeholder="e.g., 10000000"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Latent Heat at Relief (BTU/lb)
                      </label>
                      <Tooltip 
                        className="w-96"
                        content={
                          <div>
                            <p className="mb-2">Latent heat of vaporization at <strong>relieving conditions</strong> (temperature and pressure at PRD set point).</p>
                            <p className="text-sm">Per API-521 Section 4.4.3.2.7, the latent heat corresponds to conditions at the point of relief. Used to convert heat duty to vapor flow rate: Flow (lb/hr) = Heat Duty (BTU/hr) / Latent Heat (BTU/lb).</p>
                          </div>
                        }
                      />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={flowData.latentHeatOfVaporization || ''}
                      onChange={(e) => updateFlowData('latentHeatOfVaporization', parseFloat(e.target.value) || 0)}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      disabled={!isSelected}
                      placeholder="e.g., 200"
                    />
                  </div>
                </div>
              )}

              {/* Calculated values preview */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Calculated Results</h3>
                
                {/* Failure mode description */}
                {hasValidInputs && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-900">
                      <strong>Calculation Method:</strong> {previewValues.description}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Calculated Relieving Flow
                      </label>
                      <Tooltip 
                        className="min-w-max"
                        content="Required vapor relief flow based on selected failure mode and API-521 guidance"
                      />
                    </div>
                    <div className="bg-blue-50 p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        {hasValidInputs && previewValues.calculatedRelievingFlow 
                          ? `${previewValues.calculatedRelievingFlow.toLocaleString()} lb/hr` 
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
                        content="Relieving flow with ASME Section VIII safety factor applied"
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

function getFailureModeDescription(mode: string): string {
  switch (mode) {
    case 'total-condensing':
      return 'API-521 4.4.3.2.2 - Total incoming vapor to condenser (complete cooling loss)'
    case 'partial-condensing':
      return 'API-521 4.4.3.2.3 - Difference between incoming and outgoing vapor rates'
    case 'air-cooler-fan':
      return 'API-521 4.4.3.2.4 - Relief based on lost cooling capacity with natural convection credit'
    case 'pump-around':
      return 'API-521 4.4.3.2.7 - Vaporization from heat normally removed by pump-around'
    default:
      return 'Unknown failure mode'
  }
}

