import { useEffect, useRef } from 'react'

// Import CaseId type from context for type safety
type CaseId = 'external-fire' | 'control-valve-failure' | 'liquid-overfill' | 'blocked-outlet' | 'cooling-reflux-failure' | 'hydraulic-expansion'

interface CaseResult {
  asmeVIIIDesignFlow?: number
  isCalculated: boolean
  caseName?: string
}

interface UseCaseCalculationOptions<T = Record<string, unknown>> {
  caseId: CaseId
  previewValues: {
    calculatedRelievingFlow?: number | null
    asmeVIIIDesignFlow?: number | null
    [key: string]: unknown
  }
  flowData: T
  updateCaseResult: (caseId: CaseId, result: Partial<CaseResult>) => void
  storageKey: string
  isValid?: boolean // Optional override for validity check
  customCaseName?: string // Optional custom case name for display
  vesselData?: Record<string, unknown> // Optional vessel data to include in saved results
}

/**
 * Custom hook to standardize the auto-update effect pattern across all case pages
 * 
 * Handles:
 * - Updating case results when calculations change
 * - Saving calculated results to localStorage for PDF generation
 * - Marking cases as incomplete when calculations are invalid
 * 
 * @example
 * useCaseCalculation({
 *   caseId: 'external-fire',
 *   previewValues,
 *   flowData,
 *   updateCaseResult,
 *   storageKey: STORAGE_KEYS.EXTERNAL_FIRE_FLOW,
 *   vesselData: { asmeSetPressure: vesselData.asmeSetPressure }
 * })
 */
export function useCaseCalculation<T = Record<string, unknown>>({
  caseId,
  previewValues,
  flowData,
  updateCaseResult,
  storageKey,
  isValid,
  customCaseName,
  vesselData
}: UseCaseCalculationOptions<T>) {
  // Track previous values to prevent unnecessary updates
  const prevValuesRef = useRef<{
    calculatedRelievingFlow?: number | null
    asmeVIIIDesignFlow?: number | null
    isValid?: boolean
    customCaseName?: string
    flowDataString?: string
    vesselDataString?: string
  }>({})

  useEffect(() => {
    // Extract the values we actually care about
    const calculatedRelievingFlow = previewValues.calculatedRelievingFlow
    const asmeVIIIDesignFlow = previewValues.asmeVIIIDesignFlow
    
    // Serialize flowData and vesselData for comparison
    const flowDataString = JSON.stringify(flowData)
    const vesselDataString = JSON.stringify(vesselData || {})

    // Check if values have actually changed
    const valuesChanged = 
      prevValuesRef.current.calculatedRelievingFlow !== calculatedRelievingFlow ||
      prevValuesRef.current.asmeVIIIDesignFlow !== asmeVIIIDesignFlow ||
      prevValuesRef.current.isValid !== isValid ||
      prevValuesRef.current.customCaseName !== customCaseName ||
      prevValuesRef.current.flowDataString !== flowDataString ||
      prevValuesRef.current.vesselDataString !== vesselDataString

    // If nothing changed, skip the update
    if (!valuesChanged) {
      return
    }

    // Update ref with current values
    prevValuesRef.current = {
      calculatedRelievingFlow,
      asmeVIIIDesignFlow,
      isValid,
      customCaseName,
      flowDataString,
      vesselDataString
    }

    // Determine if calculation is valid
    const calculationIsValid = isValid !== undefined 
      ? isValid 
      : (calculatedRelievingFlow !== null && 
         calculatedRelievingFlow !== undefined && 
         calculatedRelievingFlow > 0)

    if (calculationIsValid && asmeVIIIDesignFlow) {
      // Update case result for design basis flow comparison
      const updatePayload: Partial<CaseResult> = {
        asmeVIIIDesignFlow: asmeVIIIDesignFlow,
        isCalculated: true
      }

      // Include custom case name if provided
      if (customCaseName) {
        updatePayload.caseName = customCaseName
      }

      updateCaseResult(caseId, updatePayload)

      // Save ALL results to localStorage for PDF generation
      // Merge input data (flowData) with calculated results (previewValues) and vessel data
      const calculatedResults = {
        ...flowData,
        ...previewValues,
        ...(vesselData || {})
      }

      localStorage.setItem(storageKey, JSON.stringify(calculatedResults))
    } else {
      // Mark as incomplete when calculation is invalid
      updateCaseResult(caseId, {
        isCalculated: false
      })
    }
  }, [
    caseId,
    previewValues.calculatedRelievingFlow,
    previewValues.asmeVIIIDesignFlow,
    flowData,
    updateCaseResult,
    storageKey,
    isValid,
    customCaseName,
    vesselData
  ])
}

