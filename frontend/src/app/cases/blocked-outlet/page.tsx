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
  sourceType: 'centrifugal-pump' | 'positive-displacement-pump' | 'pressure-source' | 'other'
  maxSourcePressure: number // psig - maximum pressure the source can deliver
  maxSourceFlowRate: number // lb/hr - maximum flow rate from source
  outletFlowCredit: number
  creditOutletFlow: boolean
}

export default function BlockedOutletCase() {
  const { vesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const designBasisFlow = getDesignBasisFlow()
  const isSelected = selectedCases['blocked-outlet']

  useScrollPosition()

  // Use custom hook for automatic localStorage sync
  const [flowData, setFlowData] = useLocalStorage<FlowData>(STORAGE_KEYS.BLOCKED_OUTLET_FLOW, {
    workingFluid: '',
    sourceType: 'centrifugal-pump',
    maxSourcePressure: 0,
    maxSourceFlowRate: 0,
    outletFlowCredit: 0,
    creditOutletFlow: false
  })

  const [pressureData, setPressureData] = useLocalStorage<CasePressureData>(STORAGE_KEYS.BLOCKED_OUTLET_PRESSURE, {
    maxAllowedVentingPressure: 0,
    maxAllowableBackpressure: 0,
    maxAllowedVentingPressurePercent: 110
  })

  const updateFlowData = (field: keyof FlowData, value: string | number | boolean) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }

  const updatePressureData = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate preview values
  const previewValues = React.useMemo(() => {
    // Check if source pressure would exceed vessel MAWP
    const sourceExceedsMawp = flowData.maxSourcePressure > vesselData.vesselDesignMawp
    
    // For centrifugal pumps designed to withstand shut-in pressure, no relief needed
    const needsRelief = sourceExceedsMawp || 
                        flowData.sourceType === 'positive-displacement-pump' ||
                        flowData.sourceType === 'pressure-source' ||
                        flowData.sourceType === 'other'
    
    if (!needsRelief || !flowData.maxSourceFlowRate || flowData.maxSourceFlowRate <= 0) {
      return {
        grossFlowRate: 0,
        calculatedRelievingFlow: 0,
        asmeVIIIDesignFlow: 0,
        outletCreditApplied: 0,
        needsRelief,
        sourceExceedsMawp
      }
    }
    
    const grossFlowRate = flowData.maxSourceFlowRate
    
    // Apply outlet flow credit if enabled
    let netFlow = grossFlowRate
    let outletCreditApplied = 0
    
    if (flowData.creditOutletFlow && flowData.outletFlowCredit && flowData.outletFlowCredit > 0) {
      outletCreditApplied = flowData.outletFlowCredit
      netFlow = Math.max(0, grossFlowRate - flowData.outletFlowCredit)
    }
    
    const calculatedRelievingFlow = netFlow
    const asmeVIIIDesignFlow = calculatedRelievingFlow > 0 ? Math.round(calculatedRelievingFlow / 0.9) : 0
    
    return {
      grossFlowRate,
      calculatedRelievingFlow,
      asmeVIIIDesignFlow,
      outletCreditApplied,
      needsRelief,
      sourceExceedsMawp
    }
  }, [
    flowData.sourceType,
    flowData.maxSourcePressure,
    flowData.maxSourceFlowRate,
    flowData.outletFlowCredit,
    flowData.creditOutletFlow,
    vesselData.vesselDesignMawp
  ])

  const hasValidInputs = flowData.maxSourceFlowRate > 0 && flowData.maxSourcePressure > 0

  // Auto-update case results when calculations change (using standardized hook)
  useCaseCalculation({
    caseId: 'blocked-outlet',
    previewValues,
    flowData,
    updateCaseResult,
    storageKey: STORAGE_KEYS.BLOCKED_OUTLET_FLOW
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
            caseName="Blocked Outlet"
            title="Blocked Outlet (Closed Outlet)"
            isSelected={isSelected}
            onToggle={() => toggleCase('blocked-outlet')}
            aboutContent={
              <>
                <p>
                  <strong>Blocked outlet</strong> (also called closed outlet) occurs when an outlet valve is inadvertently closed while equipment is on stream, exposing the equipment to pressure that can exceed its MAWP. This scenario must be evaluated for any valve (manual, control, or remotely operated) that could be inadvertently closed during operation.
                </p>
                <p>
                  Common causes include operator error closing manual valves, control valve failure in the closed position, or inadvertent closure of remotely operated valves during maintenance or switchovers. The scenario is particularly critical for equipment downstream of pumps or pressure sources.
                </p>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">API-521 Section 4.4.2: Closed Outlets</p>
                  <p>
                    Per API-521 Section 4.4.2, key considerations include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Design to Source Pressure:</strong> If equipment is designed to the maximum source pressure, closure of an outlet valve will not result in overpressure, so a PRD is not required</li>
                    <li><strong>Centrifugal Pumps:</strong> System does not require relief if pump, piping, and equipment are designed to withstand maximum shut-in pressure of the pump</li>
                    <li><strong>Positive Displacement Pumps:</strong> Pressure-relief protection is usually required to protect the pump itself and downstream equipment against shut-in conditions</li>
                    <li><strong>Administrative Controls:</strong> Can be used for manual valves unless resulting pressure exceeds corrected hydrotest pressure (see API-521 Section 4.2.2)</li>
                    <li><strong>Outlet Flow Credit:</strong> Credit can be taken for valves that remain in normal operating position during the failure (per API-521 Section 4.4.2.4)</li>
                  </ul>
                  <p>
                    The required relieving rate should be determined at relieving conditions (not normal operating conditions). The effect of frictional pressure drop in connecting lines should also be considered when determining the required relieving rate.
                  </p>
                </div>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">Calculation Method</p>
                  <p>
                    The relieving rate for blocked outlet is typically the maximum flow rate from the pressure source (pump or upstream system) at relieving conditions. For centrifugal pumps, this is the maximum flow at the pump&apos;s shut-in head. For positive displacement pumps, this is the pump&apos;s maximum capacity. For pressure-driven sources, use the maximum flow that can be delivered at the source pressure.
                  </p>
                </div>
                
                <p className="text-xs text-gray-600 border-t border-blue-200 pt-2">
                  <strong>Note:</strong> The ASME VIII design flow includes a 1/0.9 multiplier per ASME Section VIII requirements for liquid relief sizing, accounting for the 110% accumulation allowance.
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
              caseName="Blocked Outlet"
              isAutoCalculated={true}
              vesselMawp={vesselData.vesselDesignMawp}
              mawpPercent={110}
              disabled={!isSelected}
            />

            {/* Flow Calculations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
              <p className="text-sm text-gray-600 mb-4">
                Determine the maximum pressure and flow rate from the source (pump or upstream system) that could pressurize the equipment if an outlet valve is inadvertently closed.
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
                      Source Type
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="font-semibold mb-2">Select the type of pressure source:</div>
                          <div className="space-y-2 text-sm">
                            <div><strong>Centrifugal Pump:</strong> If equipment is designed for pump shut-in pressure, no relief may be needed</div>
                            <div><strong>Positive Displacement Pump:</strong> Usually requires relief protection</div>
                            <div><strong>Pressure Source:</strong> Upstream vessel, header, or system with defined pressure</div>
                            <div><strong>Other:</strong> Other pressure sources requiring evaluation</div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <select
                    value={flowData.sourceType}
                    onChange={(e) => updateFlowData('sourceType', e.target.value)}
                    disabled={!isSelected}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="centrifugal-pump">Centrifugal Pump</option>
                    <option value="positive-displacement-pump">Positive Displacement Pump</option>
                    <option value="pressure-source">Pressure Source</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Max. Source Pressure (psig)
                    </label>
                    <Tooltip 
                      className="w-96"
                      content={
                        <div>
                          <div className="mb-2">Maximum pressure that the source can deliver:</div>
                          <div className="text-sm space-y-1">
                            <div><strong>Centrifugal Pump:</strong> Shut-in head at dead-head conditions</div>
                            <div><strong>Positive Displacement Pump:</strong> Maximum discharge pressure capability</div>
                            <div><strong>Pressure Source:</strong> Maximum pressure of upstream vessel or header</div>
                          </div>
                          <div className="text-xs mt-2 pt-2 border-t border-gray-600">
                            If this pressure does not exceed vessel MAWP and equipment is designed for it, relief may not be required.
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.maxSourcePressure || ''}
                    onChange={(e) => updateFlowData('maxSourcePressure', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 150"
                    required
                  />
                  {hasValidInputs && !previewValues.sourceExceedsMawp && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Source pressure ≤ Vessel MAWP ({vesselData.vesselDesignMawp} psig)
                    </p>
                  )}
                  {hasValidInputs && previewValues.sourceExceedsMawp && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠ Source pressure exceeds Vessel MAWP ({vesselData.vesselDesignMawp} psig)
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Max. Source Flow Rate (lb/hr)
                    </label>
                    <Tooltip 
                      className="w-80"
                      content={
                        <div>
                          <div className="mb-2">Maximum flow rate from the source at relieving conditions:</div>
                          <div className="text-sm space-y-1">
                            <div><strong>Centrifugal Pump:</strong> Flow at shut-in head (typically near zero for high-head pumps)</div>
                            <div><strong>Positive Displacement Pump:</strong> Maximum pump capacity (displacement × speed)</div>
                            <div><strong>Pressure Source:</strong> Maximum flow based on pressure differential and line sizing</div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={flowData.maxSourceFlowRate || ''}
                    onChange={(e) => updateFlowData('maxSourceFlowRate', parseFloat(e.target.value) || 0)}
                    className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                      !isSelected 
                        ? 'border-gray-200 bg-gray-50 text-gray-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={!isSelected}
                    placeholder="e.g., 10000"
                    required
                  />
                </div>
              </div>

              {/* Outlet Flow Credit Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="creditOutletFlow"
                    checked={flowData.creditOutletFlow || false}
                    onChange={(e) => updateFlowData('creditOutletFlow', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={!isSelected}
                  />
                  <label htmlFor="creditOutletFlow" className="text-sm font-medium text-gray-700">
                    Apply Outlet Flow Credit
                  </label>
                  <Tooltip 
                    className="w-96"
                    content={
                      <div>
                        <div className="font-semibold mb-2">API-521 Section 4.4.2.4: Outlet Flow Credit</div>
                        <p className="mb-2">
                          Per API-521, credit can be taken for valves that remain in their normal operating position during the blocked outlet scenario.
                        </p>
                        <p className="mb-2">
                          <strong>Credit can be taken</strong> for other outlet valves (manual, control, or pump discharge) that are not affected by the primary failure and remain operational.
                        </p>
                        <p className="mb-2">
                          <strong>Example:</strong> A vessel receives 10,000 lb/hr from a pump. One outlet valve is closed (blocked), but another independent outlet normally discharges 2,000 lb/hr. If this second outlet remains operational, the relief device only needs to handle the net: 8,000 lb/hr.
                        </p>
                        <p className="text-xs mt-2 pt-2 border-t border-gray-600">
                          <strong>Calculation:</strong> Net Relief Flow = Maximum Inlet Flow - Normal Outlet Flow
                        </p>
                      </div>
                    }
                  />
                </div>
                
                {flowData.creditOutletFlow && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Normal Outlet Flow Rate (lb/hr)
                        </label>
                        <Tooltip 
                          className="w-96"
                          content="Normal outlet flow from independent valves that remain operational (lb/hr)"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={flowData.outletFlowCredit || ''}
                        onChange={(e) => updateFlowData('outletFlowCredit', parseFloat(e.target.value) || 0)}
                        className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                          !isSelected 
                            ? 'border-gray-200 bg-gray-50 text-gray-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        disabled={!isSelected}
                        placeholder="e.g., 2000"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Relief Requirement Assessment */}
              {hasValidInputs && (
                <div className={`mb-6 p-4 rounded-lg border-2 ${
                  previewValues.needsRelief 
                    ? 'bg-yellow-50 border-yellow-300' 
                    : 'bg-green-50 border-green-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      previewValues.needsRelief ? 'bg-yellow-400' : 'bg-green-400'
                    }`}>
                      {previewValues.needsRelief ? (
                        <span className="text-white font-bold text-sm">!</span>
                      ) : (
                        <span className="text-white font-bold text-sm">✓</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-sm font-semibold mb-1 ${
                        previewValues.needsRelief ? 'text-yellow-900' : 'text-green-900'
                      }`}>
                        {previewValues.needsRelief ? 'Relief Protection Required' : 'Relief May Not Be Required'}
                      </h3>
                      <p className={`text-sm ${
                        previewValues.needsRelief ? 'text-yellow-800' : 'text-green-800'
                      }`}>
                        {!previewValues.sourceExceedsMawp && flowData.sourceType === 'centrifugal-pump' ? (
                          <>Per API-521 Section 4.4.2.2, if the centrifugal pump and downstream equipment are designed to withstand the max shut-in pressure ({flowData.maxSourcePressure} psig), relief protection for the blocked outlet scenario may not be required. However, verify that ALL equipment and auxiliary devices (gasketed joints, instrumentation) can withstand this pressure.</>
                        ) : flowData.sourceType === 'positive-displacement-pump' ? (
                          <>Per API-521 Section 4.4.2.2, positive displacement pumps usually require pressure-relief protection to protect the pump itself and downstream equipment against shut-in conditions.</>
                        ) : flowData.sourceType === 'pressure-source' ? (
                          <>Verify that all equipment downstream of the pressure source is designed to withstand the maximum source pressure. Consider frictional pressure drop in connecting lines when determining the required relieving rate.</>
                        ) : (
                          <>Evaluate whether downstream equipment is designed to withstand the maximum source pressure. If not, relief protection is required per API-521 Section 4.4.2.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Calculated values preview */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Calculated Results</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Gross Inlet Flow
                      </label>
                      <Tooltip 
                        className="min-w-max"
                        content="Maximum flow from source before outlet credit"
                      />
                    </div>
                    <div className="bg-blue-50 p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        {hasValidInputs && previewValues.grossFlowRate 
                          ? `${previewValues.grossFlowRate.toLocaleString()} lb/hr` 
                          : '—'
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Outlet Credit
                      </label>
                      <Tooltip 
                        className="min-w-max"
                        content="Normal outlet flow to subtract from inlet"
                      />
                    </div>
                    <div className="bg-blue-50 p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        {flowData.creditOutletFlow && previewValues.outletCreditApplied > 0
                          ? `${previewValues.outletCreditApplied.toLocaleString()} lb/hr` 
                          : '0 lb/hr'
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
                        content="Inlet flow minus outlet credit"
                      />
                    </div>
                    <div className="bg-blue-50 p-3 rounded border">
                      <div className="font-medium text-gray-700">
                        {hasValidInputs && previewValues.calculatedRelievingFlow >= 0
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
                        content="Net relieving flow ÷ 0.9 per ASME Section VIII for liquid relief sizing (110% accumulation allowance)"
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

