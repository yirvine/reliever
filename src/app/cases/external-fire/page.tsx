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
import { calculateHeatInput, calculateEnvironmentalFactor, getInsulationMaterials, getFluidNames, getFluidProperties } from '@/lib/database'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useCaseCalculation } from '../../hooks/useCaseCalculation'
import { CasePressureData, STORAGE_KEYS } from '../../types/case-types'

interface FlowData {
  workingFluid: string
  applicableFireCode: string
  heatOfVaporization: number
  hasAdequateDrainageFirefighting?: boolean
  nfpaReductionFactor?: number
  storageType?: 'above-grade' | 'earth-covered' | 'below-grade'
  hasInsulation?: boolean
  insulationMaterial?: string
  insulationThickness?: number
  processTemperature?: number
}

export default function ExternalFireCase() {
  const { vesselData, updateVesselData, calculateFireExposedArea } = useVessel()
  const { updateCaseResult, selectedCases, toggleCase, getDesignBasisFlow } = useCase()
  const designBasisFlow = getDesignBasisFlow()
  const isSelected = selectedCases['external-fire']
  
  useScrollPosition()

  // Use custom hook for automatic localStorage sync
  const [flowData, setFlowData] = useLocalStorage<FlowData>(STORAGE_KEYS.EXTERNAL_FIRE_FLOW, {
    workingFluid: '',
    applicableFireCode: 'NFPA 30',
    heatOfVaporization: 0,
    hasAdequateDrainageFirefighting: undefined,
    nfpaReductionFactor: 1.0,
    storageType: 'above-grade',
    hasInsulation: false,
    insulationMaterial: undefined,
    insulationThickness: undefined,
    processTemperature: undefined
  })
  
  // Ensure applicableFireCode always has a valid value (for hydration safety)
  const safeFlowData = {
    ...flowData,
    applicableFireCode: flowData.applicableFireCode || 'NFPA 30'
  }

  const [pressureData, setPressureData] = useLocalStorage<CasePressureData>(STORAGE_KEYS.EXTERNAL_FIRE_PRESSURE, {
    maxAllowedVentingPressure: 0,
    maxAllowableBackpressure: 0,
    maxAllowedVentingPressurePercent: 0
  })

  const handleFlowDataChange = (field: keyof FlowData, value: string | number | boolean | undefined) => {
    setFlowData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate preview values in real-time
  const calculatePreview = () => {
    try {
      // Check if we have all required data
      if (!flowData.heatOfVaporization || flowData.heatOfVaporization === 0) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, wettedSurfaceArea: null, heatInput: null, environmentalFactor: null, reason: 'No heat of vaporization' }
      }

      if (!vesselData.vesselDiameter || !vesselData.straightSideHeight || !vesselData.headType) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, wettedSurfaceArea: null, heatInput: null, environmentalFactor: null, reason: 'Missing vessel data' }
      }

      const fireExposedArea = calculateFireExposedArea(safeFlowData.applicableFireCode)
      
      if (!fireExposedArea || fireExposedArea <= 0) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, wettedSurfaceArea: null, heatInput: null, environmentalFactor: null, reason: 'Invalid fire exposed area' }
      }
      
      // For API 521, require drainage/firefighting selection
      if (safeFlowData.applicableFireCode === 'API 521' && flowData.hasAdequateDrainageFirefighting === undefined) {
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, wettedSurfaceArea: null, heatInput: null, environmentalFactor: null, reason: 'API 521 requires drainage selection' }
      }

      // For API 521, calculate environmental factor F
      let environmentalFactor = 1.0 // Default: bare vessel
      if (safeFlowData.applicableFireCode === 'API 521') {
        environmentalFactor = calculateEnvironmentalFactor({
          storageType: flowData.storageType,
          insulationMaterial: flowData.hasInsulation ? flowData.insulationMaterial : undefined,
          insulationThickness: flowData.hasInsulation ? flowData.insulationThickness : undefined,
          processTemperature: flowData.hasInsulation ? flowData.processTemperature : undefined
        })
      }
      
      const heatInputResult = calculateHeatInput(
        safeFlowData.applicableFireCode as 'NFPA 30' | 'API 521',
        fireExposedArea,
        flowData.hasAdequateDrainageFirefighting,
        environmentalFactor
      )

      if (!heatInputResult || !heatInputResult.heatInput) {
        // Check if it's because NFPA area is too small
        if (safeFlowData.applicableFireCode === 'NFPA 30' && fireExposedArea < 20) {
          return { 
            calculatedRelievingFlow: null, 
            asmeVIIIDesignFlow: null, 
            equivalentAirFlow: null,
            wettedSurfaceArea: null,
            heatInput: null,
            environmentalFactor: null,
            reason: `NFPA 30 requires area ≥ 20 sq ft (current: ${fireExposedArea.toFixed(1)} sq ft)` 
          }
        }
        return { calculatedRelievingFlow: null, asmeVIIIDesignFlow: null, equivalentAirFlow: null, wettedSurfaceArea: null, heatInput: null, environmentalFactor: null, reason: 'Heat input calculation failed' }
      }

      let { heatInput } = heatInputResult
      
      // Apply NFPA 30 reduction factor if applicable
      if (safeFlowData.applicableFireCode === 'NFPA 30' && flowData.nfpaReductionFactor && flowData.nfpaReductionFactor < 1.0) {
        heatInput = heatInput * flowData.nfpaReductionFactor
      }
      
      const calculatedRelievingFlow = Math.round(heatInput / flowData.heatOfVaporization)
      const asmeVIIIDesignFlow = Math.round(calculatedRelievingFlow / 0.9)
      const equivalentAirFlow = Math.round(calculatedRelievingFlow * 10.28)

      // Return ALL values including intermediate calculations for PDF generation
      return { 
        calculatedRelievingFlow, 
        asmeVIIIDesignFlow, 
        equivalentAirFlow, 
        wettedSurfaceArea: fireExposedArea,
        heatInput,
        environmentalFactor,
        reason: null 
      }
    } catch (error) {
      console.error('Calculation error:', error)
      return { 
        calculatedRelievingFlow: null, 
        asmeVIIIDesignFlow: null, 
        equivalentAirFlow: null,
        wettedSurfaceArea: null,
        heatInput: null,
        environmentalFactor: null,
        reason: 'Calculation error' 
      }
    }
  }

  const previewValues = calculatePreview()

  const handleFluidPropertiesFound = (heatOfVaporization: number) => {
    handleFlowDataChange('heatOfVaporization', heatOfVaporization)
  }

  const handlePressureDataChange = (field: keyof CasePressureData, value: number) => {
    setPressureData(prev => ({ ...prev, [field]: value }))
  }

  // Reset all case-specific fields to defaults
  const handleResetFields = () => {
    // Clear localStorage completely
    localStorage.removeItem(STORAGE_KEYS.EXTERNAL_FIRE_FLOW)
    localStorage.removeItem(STORAGE_KEYS.EXTERNAL_FIRE_PRESSURE)
    
    // Reset state to defaults
    setFlowData({
      workingFluid: '',
      applicableFireCode: 'NFPA 30',
      heatOfVaporization: 0,
      hasAdequateDrainageFirefighting: undefined,
      nfpaReductionFactor: 1.0,
      storageType: 'above-grade',
      hasInsulation: false,
      insulationMaterial: undefined,
      insulationThickness: undefined,
      processTemperature: undefined
    })
    setPressureData({
      maxAllowedVentingPressure: 0,
      maxAllowableBackpressure: 0,
      maxAllowedVentingPressurePercent: 0
    })
  }

  // Auto-update case results when calculations change (using standardized hook)
  // Includes vessel geometry to trigger recalculation when vessel dimensions change
  useCaseCalculation({
    caseId: 'external-fire',
    previewValues,
    flowData,
    updateCaseResult,
    storageKey: STORAGE_KEYS.EXTERNAL_FIRE_FLOW,
    vesselData: { 
      asmeSetPressure: vesselData.asmeSetPressure,
      vesselDiameter: vesselData.vesselDiameter,
      straightSideHeight: vesselData.straightSideHeight,
      headType: vesselData.headType,
      vesselOrientation: vesselData.vesselOrientation
    }
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
            caseName="External Fire"
            title="External Fire"
            isSelected={isSelected}
            onToggle={() => toggleCase('external-fire')}
            aboutContent={
              <>
                <p>
                  <strong>External fire exposure</strong> occurs when a vessel containing flammable or non-flammable materials is exposed to an external pool fire, typically from a spill or adjacent equipment failure. The fire heats the vessel contents, causing liquid to vaporize and pressure to rise.
                </p>
                <p>
                  This case calculates the required relief capacity to prevent vessel rupture during fire exposure by determining the heat input rate based on the fire-exposed wetted surface area and applying code-specific formulas.
                </p>
                
                <div className="border-t border-blue-300 pt-3 space-y-2">
                  <p className="font-semibold text-gray-800">Code Selection: NFPA 30 vs API 521</p>
                  <p>
                    <strong>NFPA 30 (Chapter 22.7)</strong> is the standard for flammable and combustible liquids storage. Originally developed for storage tanks, it&apos;s widely applied to process vessels. NFPA 30 uses conservative piecewise formulas that typically result in higher heat input values and larger required relief capacities. It&apos;s the preferred choice for flammable liquid services, tank farms, and when simple, conservative calculations are acceptable.
                  </p>
                  <p>
                    <strong>API 521</strong> is a comprehensive process industry standard covering all equipment types. It offers more sophisticated heat input calculations with the ability to take credit for fire protection measures such as insulation, drainage systems, water spray protection, and special storage configurations (earth-covered, below-grade). API 521 is preferred when detailed engineering analysis can justify reduced relief requirements, or when process fluids are non-flammable. The environmental factor (F) in API 521 can significantly reduce required capacity when proper mitigation is in place.
                  </p>
                </div>
                
                <p className="text-xs text-gray-600 border-t border-blue-200 pt-2">
                  External fire is often the governing case for pressure relief valve sizing in process vessels and storage tanks.
                </p>
              </>
            }
            rightControls={
              /* Reset button on the right side below Include toggle */
              <ResetCaseFields 
                onReset={handleResetFields}
                caseName="External Fire"
                disabled={!isSelected}
              />
            }
          />

        <div className={`space-y-4 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
          {/* Vessel Properties - Shared across all cases */}
          <CollapsibleVesselProperties />

          {/* Case-Specific Pressure Settings */}
          <CasePressureSettings
            pressureData={pressureData}
            onChange={handlePressureDataChange}
            caseName="External Fire"
            isAutoCalculated={true}
            vesselMawp={vesselData.vesselDesignMawp}
            fireExposedArea={calculateFireExposedArea(safeFlowData.applicableFireCode)}
            mawpPercent={121}
            disabled={!isSelected}
          />

          {/* Flow Calculations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Calculations</h2>
            
            {/* Applicable Code Dropdown */}
            <div className="flex items-center gap-2 mb-6">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Applicable Code
              </label>
              <Tooltip 
                className="w-72"
                content={
                  <div className="text-sm">
                    Select the applicable code for heat input calculation. NFPA 30 is typically used for flammable liquids (more conservative), while API 521 offers advanced fire protection credits. See the <strong>About this scenario</strong> section above for detailed guidance on code selection.
                  </div>
                }
              />
              <select
                value={safeFlowData.applicableFireCode}
                onChange={(e) => {
                  const newCode = e.target.value
                  handleFlowDataChange('applicableFireCode', newCode)
                  
                  // Smart defaulting for API 521
                  if (newCode === 'API 521' && flowData.hasAdequateDrainageFirefighting === undefined) {
                    handleFlowDataChange('hasAdequateDrainageFirefighting', false) // Default to "No"
                  }
                }}
                disabled={!isSelected}
                className={`h-10 px-3 py-2 border rounded-md text-gray-900 bg-white ${
                  !isSelected 
                    ? 'border-gray-200 bg-gray-50 text-gray-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                <option value="NFPA 30">NFPA 30</option>
                <option value="API 521">API 521</option>
              </select>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Fluid
                </label>
                <select
                  value={flowData.workingFluid || ''}
                  onChange={(e) => {
                    handleFlowDataChange('workingFluid', e.target.value)
                    // Get fluid properties and update heat of vaporization
                    const properties = getFluidProperties(e.target.value)
                    if (properties) {
                      handleFluidPropertiesFound(properties.heat_of_vaporization)
                    } else {
                      // Clear heat of vaporization when no fluid is selected
                      handleFlowDataChange('heatOfVaporization', 0)
                    }
                  }}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Molecular Weight (lb/lbmol)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={(() => {
                    if (flowData.workingFluid) {
                      const properties = getFluidProperties(flowData.workingFluid)
                      return properties?.molecular_weight || ''
                    }
                    return ''
                  })()}
                  disabled
                  className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-gray-700 font-medium"
                  title="Auto-filled from selected working fluid"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-filled from working fluid selection</p>
              </div>

              {/* Fire Protection / Mitigation - Dynamic based on selected code */}
              <div>
                <div className="mb-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      {safeFlowData.applicableFireCode === 'NFPA 30' 
                        ? 'Fire protection / mitigation factor'
                        : 'Adequate drainage & firefighting?'}
                    </label>
                    <Tooltip 
                      className="w-80 break-words"
                      content={
                        safeFlowData.applicableFireCode === 'NFPA 30' ? (
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
                            <div className="font-semibold mb-2">API 521 Section 4.4.13.2.4.2 - Heat Input Formulas:</div>
                            <div className="mb-2">
                              <div className="font-medium">With adequate drainage & firefighting:</div>
                              <div>Q = 21,000 F (A<sub>wet</sub>)<sup>0.82</sup></div>
                            </div>
                            <div className="mb-2">
                              <div className="font-medium">Without adequate drainage & firefighting:</div>
                              <div>Q = 34,500 F (A<sub>wet</sub>)<sup>0.82</sup></div>
                            </div>
                            <div className="text-xs mt-2 mb-2 border-t border-gray-600 pt-2">
                              <div>Q = Total heat absorption (BTU/hr)</div>
                              <div>F = Environmental factor (default: 1)</div>
                              <div>A<sub>wet</sub> = Total wetted surface area (sq ft)</div>
                            </div>
                            <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                              <div className="font-semibold mb-1">Adequate Drainage Criteria (per API 521):</div>
                              <div className="mb-1">
                                The determination is <strong>subjective and left to the user</strong>, but should:
                              </div>
                              <ul className="list-disc list-inside space-y-0.5 ml-1">
                                <li>Carry flammable/combustible liquids away from vessel</li>
                                <li>Consider removal methods: sewers, open trenches, sloping, etc.</li>
                                <li>Account for both pool fire liquids AND firewater from responders</li>
                              </ul>
                              <div className="mt-1 italic">
                                Example drainage criteria: See API 2510
                              </div>
                            </div>
                          </>
                        )
                      }
                    />
                  </div>
                </div>
                
                {/* NFPA 30: Reduction Factor Dropdown */}
                {safeFlowData.applicableFireCode === 'NFPA 30' && (
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
                      <option value="1.0">No protection (1.0)</option>
                      <option value="0.5">Drainage provided (0.5)</option>
                      <option value="0.4">Water spray + drainage (0.4)</option>
                      <option value="0.3">Auto spray or insulation (0.3)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Reduction factor per NFPA 30 Section 22.7.3.5</p>
                  </>
                )}

                {/* API 521: Yes/No Drainage & Firefighting */}
                {safeFlowData.applicableFireCode === 'API 521' && (
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
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Affects heat input coefficient (21,000 vs 34,500)</p>
                  </>
                )}
              </div>
            </div>

            {/* API 521 Priority 2: Environmental Factor / Insulation Section */}
            {safeFlowData.applicableFireCode === 'API 521' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API 521 Environmental Factor (Optional)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure vessel-specific parameters, insulation, or special storage conditions to reduce heat input per API 521 §4.4.13.2.7
                </p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Head Protected by Skirt */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Bottom Head Protected by Skirt?
                      </label>
                      <Tooltip
                        className="w-80"
                        content={
                          <>
                            <div className="mb-2">
                              <strong className="text-blue-300">API 521 §4.4.13.2.2:</strong>
                            </div>
                            <div className="mb-2">
                              Vessel heads protected by support skirts with limited ventilation are normally not included when determining wetted area.
                            </div>
                            <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                              Select &quot;Yes&quot; if bottom head is enclosed by a support skirt with minimal ventilation.
                            </div>
                          </>
                        }
                      />
                    </div>
                    <select
                      value={vesselData.headProtectedBySkirt ? 'true' : 'false'}
                      onChange={(e) => updateVesselData('headProtectedBySkirt', e.target.value === 'true')}
                      disabled={!isSelected}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes (skirt protection)</option>
                    </select>
                  </div>

                  {/* Fire Source Elevation */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Fire Source Elevation (ft)
                      </label>
                      <Tooltip
                        className="w-80"
                        content={
                          <>
                            <div className="mb-2">
                              <strong className="text-blue-300">API 521 §4.4.13.2.2:</strong>
                            </div>
                            <div className="mb-2">
                              Only wetted surface ≤25 ft above fire source is included in fire exposure calculation.
                            </div>
                            <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                              Enter elevation of fire source above grade (0 = grade level, typical). Use for vessels on elevated platforms.
                            </div>
                          </>
                        }
                      />
                    </div>
                    <input
                      type="number"
                      step="1"
                      value={vesselData.fireSourceElevation ?? 0}
                      onChange={(e) => updateVesselData('fireSourceElevation', parseFloat(e.target.value) || 0)}
                      disabled={!isSelected}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Grade level = 0 ft (default)</p>
                  </div>

                  {/* Storage Type */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Storage Type
                      </label>
                      <Tooltip
                        className="w-80"
                        content={
                          <>
                            <div className="font-semibold mb-2">API 521 Table 5 - Environmental Factors:</div>
                            <div className="mb-1"><strong>Above-grade:</strong> F = 1.0 or calculated from insulation</div>
                            <div className="mb-1"><strong>Earth-covered:</strong> F = 0.03 (minimal fire exposure)</div>
                            <div className="mb-2"><strong>Below-grade:</strong> F = 0.0 (no fire exposure)</div>
                            <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                              Special storage types override insulation credits.
                            </div>
                          </>
                        }
                      />
                    </div>
                    <select
                      value={flowData.storageType || 'above-grade'}
                      onChange={(e) => {
                        const newStorageType = e.target.value
                        
                        // Auto-reset insulation when changing away from above-grade
                        if (newStorageType !== 'above-grade' && flowData.hasInsulation) {
                          const updatedData = {
                            ...flowData,
                            storageType: newStorageType as 'above-grade' | 'earth-covered' | 'below-grade',
                            hasInsulation: false,
                            insulationMaterial: undefined,
                            insulationThickness: undefined,
                            processTemperature: undefined
                          }
                          setFlowData(updatedData)
                          localStorage.setItem('external-fire-flow-data', JSON.stringify(updatedData))
                        } else {
                          handleFlowDataChange('storageType', newStorageType)
                        }
                      }}
                      disabled={!isSelected}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                        !isSelected 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    >
                      <option value="above-grade">Above-grade (standard)</option>
                      <option value="earth-covered">Earth-covered (F=0.03)</option>
                      <option value="below-grade">Below-grade (F=0.0)</option>
                    </select>
                  </div>

                  {/* Has Insulation */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Fire-rated Insulation?
                      </label>
                      <Tooltip
                        className="w-80"
                        content={
                          <>
                            <div className="font-semibold mb-2">API 521 §4.4.13.2.7 Requirements:</div>
                            <div className="mb-2">Fire-rated insulation must:</div>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>Withstand 1660°F for 2 hours</li>
                              <li>Resist dislodgment by fire hose streams</li>
                              <li>Use stainless steel jacketing (recommended)</li>
                            </ul>
                            <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                              Only fire-rated insulation qualifies for F factor credit.
                            </div>
                          </>
                        }
                      />
                    </div>
                    <select
                      value={flowData.hasInsulation ? 'true' : 'false'}
                      onChange={(e) => handleFlowDataChange('hasInsulation', e.target.value === 'true')}
                      disabled={!isSelected || flowData.storageType !== 'above-grade'}
                      className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                        !isSelected || flowData.storageType !== 'above-grade'
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes (fire-rated)</option>
                    </select>
                    {flowData.storageType !== 'above-grade' && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Only applicable for above-grade storage
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">

                  {/* Insulation Material - Only show if hasInsulation */}
                  {flowData.hasInsulation && flowData.storageType === 'above-grade' && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Insulation Material
                          </label>
                          <Tooltip
                            className="w-80"
                            content={
                              <>
                                <div className="font-semibold mb-2">API 521 Table 6 - Thermal Conductivity:</div>
                                <div className="text-sm mb-2">
                                  Values shown are k at 1000°F in Btu·in/(h·ft²·°F).
                                  Lower k = better insulation = lower F factor.
                                </div>
                                <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                                  Calcium Silicate Type II is common for fire protection.
                                </div>
                              </>
                            }
                          />
                        </div>
                        <select
                          value={flowData.insulationMaterial || ''}
                          onChange={(e) => handleFlowDataChange('insulationMaterial', e.target.value)}
                          disabled={!isSelected}
                          className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                            !isSelected 
                              ? 'border-gray-200 bg-gray-50 text-gray-500' 
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          required
                        >
                          <option value="">Select material...</option>
                          {getInsulationMaterials().map((material) => (
                            <option key={material.id} value={material.name}>
                              {material.name} (k={material.thermalConductivity_1000F})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Insulation Thickness (in)
                          </label>
                          <Tooltip
                            className="w-80"
                            content={
                              <>
                                <div className="mb-2">
                                  Thickness of fire-rated insulation in inches.
                                </div>
                                <div className="text-sm mb-2">
                                  Typical range: 1-4 inches for fire protection.
                                  Thicker insulation = lower F factor = less heat input.
                                </div>
                                <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                                  Used in API 521 Equation (17): F = (k/δ) × (1/(1660-T_f)) × 260
                                </div>
                              </>
                            }
                          />
                        </div>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={flowData.insulationThickness || ''}
                          onChange={(e) => handleFlowDataChange('insulationThickness', parseFloat(e.target.value) || 0)}
                          disabled={!isSelected}
                          className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                            !isSelected 
                              ? 'border-gray-200 bg-gray-50 text-gray-500' 
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          placeholder="e.g., 2.0"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Process Temp (°F)
                          </label>
                          <Tooltip
                            className="w-80"
                            content={
                              <>
                                <div className="mb-2">
                                  Process temperature at relieving conditions (°F).
                                </div>
                                <div className="text-sm mb-2">
                                  Used to calculate temperature difference between fire (1660°F) and process fluid.
                                  Higher process temp = smaller ΔT = higher F factor.
                                </div>
                                <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                                  Typical range: 100-500°F for most applications.
                                </div>
                              </>
                            }
                          />
                        </div>
                        <input
                          type="number"
                          step="1"
                          value={flowData.processTemperature || ''}
                          onChange={(e) => handleFlowDataChange('processTemperature', parseFloat(e.target.value) || 0)}
                          disabled={!isSelected}
                          className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                            !isSelected 
                              ? 'border-gray-200 bg-gray-50 text-gray-500' 
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          placeholder="e.g., 300"
                        />
                      </div>

                      {/* Empty cell for grid alignment */}
                      <div></div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* NFPA 30 Applicability Warning */}
            {safeFlowData.applicableFireCode === 'NFPA 30' && (
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
                          safeFlowData.applicableFireCode === 'NFPA 30' ? (
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