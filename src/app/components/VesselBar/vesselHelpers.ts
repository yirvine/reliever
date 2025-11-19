/**
 * VesselBar Helper Functions
 * 
 * Shared utility functions for vessel management:
 * - Case data collection from localStorage
 * - Case data loading into contexts
 * - Unique tag generation
 * - Data clearing
 */

import { type CaseId, type CaseResult } from '../../context/CaseContext'
import { type SavedVessel } from '../../context/VesselContext'

/**
 * Collect all case data from localStorage for saving to database
 */
export function collectCaseDataFromLocalStorage() {
  const caseTypes = [
    'external-fire',
    'control-valve-failure',
    'liquid-overfill',
    'blocked-outlet',
    'cooling-reflux-failure',
    'hydraulic-expansion',
    'heat-exchanger-tube-rupture'
  ]

  // Get selection state and results from localStorage
  const selectedCasesData = localStorage.getItem('reliever-selected-cases')
  const selectedCases = selectedCasesData ? JSON.parse(selectedCasesData) : {}
  
  const caseResultsData = localStorage.getItem('reliever-case-results')
  const caseResults = caseResultsData ? JSON.parse(caseResultsData) : {}

  return caseTypes.map(caseType => {
    const flowData = localStorage.getItem(`${caseType}-flow-data`)
    const pressureData = localStorage.getItem(`${caseType}-pressure-data`)
    
    const flowParsed = flowData ? JSON.parse(flowData) : {}
    const pressureParsed = pressureData ? JSON.parse(pressureData) : {}
    
    const result = caseResults[caseType]

    return {
      caseType,
      caseName: result?.caseName || null,
      // ONLY save user inputs - calculated values will be regenerated client-side
      flowData: flowParsed,
      pressureData: pressureParsed,
      // Save selection state and calculated results
      isSelected: selectedCases[caseType] || false,
      isCalculated: result?.isCalculated || false,
      asmeVIIIDesignFlow: result?.asmeVIIIDesignFlow || null,
      calculatedRelievingFlow: null, // Deprecated, can be removed
    }
  })
}

/**
 * Load cases from database response into CaseContext
 */
export function loadCasesFromData(
  cases: Array<{
    case_type: string
    flow_data?: Record<string, unknown>
    pressure_data?: Record<string, unknown>
    is_selected?: boolean
    calculated_relieving_flow?: number
    asme_viii_design_flow?: number
    is_calculated?: boolean
    case_name?: string
  }>,
  applyCaseData: (selectedCases: Record<CaseId, boolean>, caseResults: Record<CaseId, CaseResult>) => void
) {
  // Rebuild selectedCases and caseResults from database
  const newSelectedCases: Record<string, boolean> = {
    'external-fire': false,
    'control-valve-failure': false,
    'liquid-overfill': false,
    'blocked-outlet': false,
    'cooling-reflux-failure': false,
    'hydraulic-expansion': false,
    'heat-exchanger-tube-rupture': false
  }
  
  const newCaseResults: Record<string, unknown> = {}
  
  cases.forEach((caseData) => {
    const caseType = caseData.case_type
    
    // Restore flow and pressure data (per-case localStorage keys)
    if (caseData.flow_data) {
      localStorage.setItem(`${caseType}-flow-data`, JSON.stringify(caseData.flow_data))
    }
    if (caseData.pressure_data) {
      localStorage.setItem(`${caseType}-pressure-data`, JSON.stringify(caseData.pressure_data))
    }
    
    // Restore selection state
    if (caseData.is_selected !== undefined) {
      newSelectedCases[caseType] = caseData.is_selected
    }
    
    // Restore case results - ALWAYS include the case, even if not calculated
    // This prevents applyCaseData from resetting calculated cases to defaults
    newCaseResults[caseType] = {
      caseId: caseType,
      caseName: caseData.case_name || '',
      asmeVIIIDesignFlow: caseData.asme_viii_design_flow || null,
      isCalculated: caseData.is_calculated || false
    }
  })
  
  // Apply data to CaseContext (which will handle localStorage sync via its useEffects)
  // CaseContext is now the ONLY writer for reliever-selected-cases and reliever-case-results
  applyCaseData(
    newSelectedCases as Record<CaseId, boolean>,
    newCaseResults as Record<CaseId, CaseResult>
  )
}

/**
 * Generate a unique default vessel tag in the format "untitled-NN"
 * where NN is a zero-padded number (01, 02, 03...).
 * Guarantees no collisions by checking all existing tags.
 */
export function generateUniqueUntitledTag(userVessels: SavedVessel[]) {
  const existing = new Set(
    userVessels
      .map(v => v.vessel_tag)
      .filter(tag => /^untitled-\d+$/.test(tag || ''))
  )

  let index = 1
  while (true) {
    const candidate = `untitled-${String(index).padStart(2, '0')}`
    if (!existing.has(candidate)) return candidate
    index++
  }
}

/**
 * Clear all vessel and case data from contexts and localStorage
 */
export function clearAllData(
  updateVesselData: (field: keyof import('../../context/VesselContext').VesselData, value: string | number | boolean) => void,
  setCurrentVesselId: (id: string | null) => void,
  keepVesselId = false
): void {
  // Clear vessel context (reset to defaults)
  updateVesselData('vesselTag', '')
  updateVesselData('vesselName', '')
  updateVesselData('straightSideHeight', 0)
  updateVesselData('vesselDiameter', 0)
  updateVesselData('headType', '')
  updateVesselData('vesselDesignMawp', 0)
  updateVesselData('asmeSetPressure', 0)
  updateVesselData('vesselOrientation', '')
  updateVesselData('headProtectedBySkirt', false)
  updateVesselData('fireSourceElevation', 0)
  
  // Clear all case localStorage
  const caseTypes = [
    'external-fire',
    'control-valve-failure',
    'liquid-overfill',
    'blocked-outlet',
    'cooling-reflux-failure',
    'hydraulic-expansion',
    'heat-exchanger-tube-rupture'
  ]
  
  caseTypes.forEach(caseType => {
    localStorage.removeItem(`${caseType}-flow-data`)
    localStorage.removeItem(`${caseType}-pressure-data`)
  })
  
  // Clear case selection data
  localStorage.removeItem('reliever-selected-cases')
  localStorage.removeItem('reliever-case-results')
  
  // Only clear vessel ID if not creating a new vessel
  if (!keepVesselId) {
    setCurrentVesselId(null)
  }
}

