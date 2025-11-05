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
  manualFlowRate: number
  outletFlowCredit: number
  creditOutletFlow: boolean
}

export default function LiquidOverfillCase() {
  const { vesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const designBasisFlow = getDesignBasisFlow()
  const isSelected = selectedCases['liquid-overfill']

  useScrollPosition()

  // Use custom hook for automatic localStorage sync
  const [flowData, setFlowData] = useLocalStorage<FlowData>(STORAGE_KEYS.LIQUID_OVERFILL_FLOW, {
    workingFluid: '',
    manualFlowRate: 0,
    outletFlowCredit: 0,
    creditOutletFlow: false
  })

  const [casePressureData, setCasePressureData] = useLocalStorage<CasePressureData>(STORAGE_KEYS.LIQUID_OVERFILL_PRESSURE, {
    maxAllowedVentingPressure: 0,
    maxAllowableBackpressure: 0,
    maxAllowedVentingPressurePercent: 110
  })

  const updateFlowData = (field: keyof FlowData, value: number | boolean | string) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }

  const updateCasePressureData = (field: keyof CasePressureData, value: number) => {
    setCasePressureData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate preview values (like other cases)
  const previewValues = React.useMemo(() => {
    const grossFlowRate = flowData.manualFlowRate // lb/hr
    
    // Apply outlet flow credit if enabled
    let netFlow = grossFlowRate
    let outletCreditApplied = 0
    
    if (flowData.creditOutletFlow && flowData.outletFlowCredit && flowData.outletFlowCredit > 0) {
      outletCreditApplied = flowData.outletFlowCredit
      netFlow = Math.max(0, grossFlowRate - flowData.outletFlowCredit)
    }
    
    const calculatedRelievingFlow = netFlow // lb/hr (net after outlet credit)
    const asmeVIIIDesignFlow = calculatedRelievingFlow > 0 ? Math.round(calculatedRelievingFlow / 0.9) : 0
    
    return {
      grossFlowRate,
      calculatedRelievingFlow,
      asmeVIIIDesignFlow,
      outletCreditApplied
    }
  }, [flowData.manualFlowRate, flowData.outletFlowCredit, flowData.creditOutletFlow])

  const hasValidInputs = flowData.manualFlowRate > 0

  // Auto-update case results when calculations change (using standardized hook)
  useCaseCalculation({
    caseId: 'liquid-overfill',
    previewValues,
    flowData,
    updateCaseResult,
    storageKey: STORAGE_KEYS.LIQUID_OVERFILL_FLOW
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
            caseName="Liquid Overfill"
            title="Liquid Overfill"
            isSelected={isSelected}
            onToggle={() => toggleCase('liquid-overfill')}
            aboutContent={
              <>
                <p>
                  <strong>Liquid overfill</strong> occurs when a vessel receives liquid at a rate faster than it can be removed, causing the vessel to fill and potentially overpressure. This scenario is common in surge vessels, columns, towers, and storage tanks during normal operations, start-up, or shutdown.
                </p>
                <p>
                  Common causes include pump failure to stop on high level, level control system failure, inadvertent valve opening on inlet lines, or closure of outlet valves. If the source pressure can exceed the relief device set pressure or vessel design pressure, overfilling must be evaluated.
                </p>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">API-521 Section 4.4.7: Overfilling</p>
                  <p>
                    Per API-521, the required relieving rate for liquid overfill is simply the <strong>maximum liquid pump-in rate</strong>. This is typically determined by:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Pump capacity:</strong> The maximum discharge capacity of the largest feed pump (most common method)</li>
                    <li><strong>Pressure-driven flow:</strong> Maximum flow based on pressure differential between upstream source and vessel</li>
                    <li><strong>Multiple sources:</strong> Consider all credible inlet flow paths that could simultaneously contribute</li>
                    <li><strong>Outlet flow credit:</strong> Per API-521 Section 4.4.8.3, relief rate = maximum inlet flow minus normal outlet flow (for outlets that remain operational)</li>
                  </ul>
                  <p>
                    API-521 emphasizes that all phases of operation shall be evaluated, with particular attention to start-up and non-routine operations where flow rates and conditions may differ from normal operations.
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
            pressureData={casePressureData}
            onChange={updateCasePressureData}
            caseName="Liquid Overfill"
            isAutoCalculated={true}
            vesselMawp={vesselData.vesselDesignMawp}
            mawpPercent={110}
            disabled={!isSelected}
          />

          {/* Flow Calculations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
            <p className="text-sm text-gray-600 mb-4">
              Determine the maximum flow of liquid that could credibly fill the tank if an upstream valve fails, 
              either based on the capacity of a directly connected pump (most common method), the pressure 
              differential between the tank and some other directly connected point A, or by some other credible means.
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max. Liquid Inlet Flow Rate (lb/hr)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={flowData.manualFlowRate || ''}
                  onChange={(e) => updateFlowData('manualFlowRate', parseFloat(e.target.value) || 0)}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                   <br></br>
                </label>
                <div className="flex items-center gap-2 h-10">
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
                        <div className="font-semibold mb-2">API-521 Section 4.4.8.3: Outlet Flow Credit</div>
                        <p className="mb-2">
                          Per API-521, the required relieving rate is the difference between maximum inlet flow and normal outlet flow.
                        </p>
                        <p className="mb-2">
                          <strong>Credit can be taken</strong> for outlet valves (manual, control, or pump discharge) that remain operational and in their normal operating position during the overfill scenario.
                        </p>
                        <p className="mb-2">
                          <strong>Example:</strong> A vessel receives 10,000 lb/hr from a feed pump but normally discharges 2,000 lb/hr through a downstream control valve. If the outlet remains operational, the relief device only needs to handle the net: 8,000 lb/hr.
                        </p>
                        <p className="text-xs mt-2 pt-2 border-t border-gray-600">
                          <strong>Calculation:</strong> Net Relief Flow = Maximum Inlet Flow - Normal Outlet Flow
                        </p>
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Empty cell for 4-column grid alignment */}
              <div></div>
            </div>

            {/* Outlet Flow Credit Input - shown when checkbox is checked */}
            {flowData.creditOutletFlow && (
              <div className="mb-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Calculated values preview (read-only) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Gross Inlet Flow
                    </label>
                    <Tooltip 
                      className="min-w-max"
                      content="Maximum inlet flow before outlet credit"
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
                It will be automatically selected when you start entering data.
              </p>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  )
}