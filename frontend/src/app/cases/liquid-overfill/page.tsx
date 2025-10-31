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
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { CasePressureData, STORAGE_KEYS } from '../../types/case-types'

interface FlowData {
  manualFlowRate: number
}

export default function LiquidOverfillCase() {
  const { vesselData, updateVesselData } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const isSelected = selectedCases['liquid-overfill']
  
  useScrollPosition()

  // Use custom hook for automatic localStorage sync
  const [flowData, setFlowData] = useLocalStorage<FlowData>(STORAGE_KEYS.LIQUID_OVERFILL_FLOW, {
    manualFlowRate: 0
  })

  const [casePressureData, setCasePressureData] = useLocalStorage<CasePressureData>(STORAGE_KEYS.LIQUID_OVERFILL_PRESSURE, {
    maxAllowedVentingPressure: 0,
    maxAllowableBackpressure: 0,
    maxAllowedVentingPressurePercent: 110
  })

  const updateFlowData = (field: keyof FlowData, value: number) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }

  const updateCasePressureData = (field: keyof CasePressureData, value: number) => {
    setCasePressureData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate preview values (like other cases)
  const previewValues = React.useMemo(() => {
    const calculatedRelievingFlow = flowData.manualFlowRate // lb/hr
    const asmeVIIIDesignFlow = calculatedRelievingFlow > 0 ? Math.round(calculatedRelievingFlow / 0.9) : 0
    
    return {
      calculatedRelievingFlow,
      asmeVIIIDesignFlow
    }
  }, [flowData.manualFlowRate])

  const hasValidInputs = flowData.manualFlowRate > 0

  // Auto-update case results when calculations change (like other cases)
  React.useEffect(() => {
    if (previewValues.calculatedRelievingFlow && previewValues.calculatedRelievingFlow > 0) {
      updateCaseResult('liquid-overfill', {
        asmeVIIIDesignFlow: previewValues.asmeVIIIDesignFlow,
        isCalculated: true
      })
    }
  }, [previewValues.calculatedRelievingFlow, previewValues.asmeVIIIDesignFlow, updateCaseResult])

  // Auto-enable case when user starts entering data
  useEffect(() => {
    if (!isSelected && (vesselData.vesselTag || flowData.manualFlowRate > 0)) {
      toggleCase('liquid-overfill')
    }
  }, [vesselData.vesselTag, flowData.manualFlowRate, isSelected, toggleCase])

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
            
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Case 3 - Liquid Overfill</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Calculate relief requirements for liquid overfill scenarios where the vessel receives liquid 
                at a rate faster than it can be removed.
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Include Case</span>
                <div className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                  ${isSelected ? 'bg-green-600' : 'bg-gray-200'}
                `}
                onClick={() => toggleCase('liquid-overfill')}
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
            {/* Vessel Properties */}
            <VesselProperties
              vesselData={vesselData}
              onChange={updateVesselData}
              disabled={!isSelected}
            />

          {/* Liquid Overfill Parameters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Liquid Overfill Flow Rate</h2>
            <p className="text-gray-600 mb-6">
              Determine the maximum flow of liquid that could credibly fill the tank if an upstream valve fails, 
              either based on the capacity of a directly connected pump (most common method), the pressure 
              differential between the tank and some other directly connected point A, or by some other credible means. 
              Input this flow below.
            </p>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Credible Liquid Flow Rate (lb/hr)
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
                placeholder="e.g., 1000"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the flow rate in pounds per hour (lb/hr)
              </p>
            </div>
          </div>

          {/* Case Pressure Settings */}
          <CasePressureSettings
            pressureData={casePressureData}
            onChange={updateCasePressureData}
            caseName="Liquid Overfill"
            vesselMawp={vesselData.vesselDesignMawp}
            disabled={!isSelected}
          />

          {/* Flow Summary - Same style as other cases */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Summary</h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              {/* 1st column - Calculated Relieving Flow */}
              <div>
                <div className="flex items-center space-x-1 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Calculated Relieving Flow (lb/hr)
                  </label>
                </div>
                <div className={`p-3 rounded border ${
                  hasValidInputs ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <div className={`font-medium ${
                    hasValidInputs ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {hasValidInputs && previewValues.calculatedRelievingFlow 
                      ? `${previewValues.calculatedRelievingFlow.toLocaleString()} lb/hr` 
                      : hasValidInputs ? '—' : 'Enter valid inputs to calculate'
                    }
                  </div>
                </div>
              </div>

              {/* 2nd column - ASME VIII Design Flow */}
              <div>
                <div className="flex items-center space-x-1 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ASME VIII Design Flow (lb/hr)
                  </label>
                  <Tooltip 
                    className="min-w-max"
                    content="Calculated flow ÷ 0.9 safety factor"
                  />
                </div>
                <div className={`p-3 rounded border ${
                  hasValidInputs ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <div className={`font-medium ${
                    hasValidInputs ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {hasValidInputs && previewValues.asmeVIIIDesignFlow 
                      ? `${previewValues.asmeVIIIDesignFlow.toLocaleString()} lb/hr` 
                      : hasValidInputs ? '—' : 'Enter valid inputs to calculate'
                    }
                  </div>
                </div>
              </div>

              {/* 3rd column - Empty for consistency */}
              <div></div>

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
                      const isCurrentDesignBasis = designBasisFlow && 
                        designBasisFlow.caseName === 'Liquid Overfill' && 
                        previewValues.calculatedRelievingFlow && 
                        previewValues.calculatedRelievingFlow > 0
                      
                      if (isCurrentDesignBasis) {
                        return 'Yes'
                      } else if (previewValues.calculatedRelievingFlow && previewValues.calculatedRelievingFlow > 0) {
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