'use client'

/**
 * CaseContext.tsx
 * 
 * Global state management for pressure relief calculation cases.
 * Handles case selection, calculation results, and determining the design basis flow.
 * 
 * Key Features:
 * - Toggle cases on/off from both main page and case pages
 * - Store and update calculation results for each case
 * - Calculate design basis flow (maximum flow among selected cases)
 * - Persist case selections and results during navigation
 */

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'

// Valid case IDs in the system. Update this when adding new cases.
export type CaseId = 'external-fire' | 'nitrogen-control' | 'additional-cases'

/**
 * Represents the calculation result for a specific case.
 * Each case maintains its own state of calculation and flow results.
 */
export interface CaseResult {
  caseId: CaseId                      // Unique identifier for the case
  caseName: string                    // Display name (e.g., "External Fire")
  asmeVIIIDesignFlow: number | null   // Final flow rate after ASME VIII safety factor
  isCalculated: boolean               // Whether calculations are complete and valid
}

/**
 * Core functionality provided by the CaseContext.
 * This interface defines all operations available to components.
 */
interface CaseContextType {
  selectedCases: Record<CaseId, boolean>    // Which cases are toggled on/off
  caseResults: Record<CaseId, CaseResult>   // Latest calculation results
  toggleCase: (caseId: CaseId) => void      // Toggle a case's selected state
  updateCaseResult: (caseId: CaseId, result: Partial<CaseResult>) => void  // Update calculations
  getDesignBasisFlow: () => { flow: number; caseName: string } | null      // Get highest flow
  getSelectedCaseCount: () => number        // Count of active cases
  hasCalculatedResults: () => boolean       // Whether any calculations exist
}

const defaultCases = {
  'external-fire': false,
  'nitrogen-control': false,
  'additional-cases': false
}

const defaultCaseResults: Record<CaseId, CaseResult> = {
  'external-fire': {
    caseId: 'external-fire',
    caseName: 'External Fire',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  },
  'nitrogen-control': {
    caseId: 'nitrogen-control', 
    caseName: 'Nitrogen Control Failure',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  },
  'additional-cases': {
    caseId: 'additional-cases',
    caseName: 'Additional Cases',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  }
}

const CaseContext = createContext<CaseContextType | undefined>(undefined)

export function CaseProvider({ children }: { children: ReactNode }) {
  const [selectedCases, setSelectedCases] = useState(defaultCases)
  const [caseResults, setCaseResults] = useState(defaultCaseResults)

  // Load saved state from localStorage on mount
  useEffect(() => {
    // Load selected cases
    const savedSelectedCases = localStorage.getItem('reliever-selected-cases')
    if (savedSelectedCases) {
      try {
        const parsed = JSON.parse(savedSelectedCases)
        setSelectedCases(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to parse saved selected cases:', error)
      }
    }

    // Load case results
    const savedCaseResults = localStorage.getItem('reliever-case-results')
    if (savedCaseResults) {
      try {
        const parsed = JSON.parse(savedCaseResults)
        setCaseResults(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to parse saved case results:', error)
      }
    }
  }, [])

  // Save selected cases to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('reliever-selected-cases', JSON.stringify(selectedCases))
  }, [selectedCases])

  // Save case results to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('reliever-case-results', JSON.stringify(caseResults))
  }, [caseResults])

  /**
   * Toggle a case's selected state.
   * This affects whether the case contributes to the design basis flow
   * and whether its page is interactive.
   */
  const toggleCase = (caseId: CaseId) => {
    setSelectedCases(prev => ({
      ...prev,
      [caseId]: !prev[caseId]
    }))
  }

  /**
   * Update calculation results for a specific case.
   * Memoized to prevent unnecessary re-renders in child components.
   * Partial updates are allowed to avoid overwriting unrelated fields.
   */
  const updateCaseResult = useCallback((caseId: CaseId, result: Partial<CaseResult>) => {
    setCaseResults(prev => ({
      ...prev,
      [caseId]: { ...prev[caseId], ...result }
    }))
  }, [])

  /**
   * Calculate the current design basis flow.
   * This is the highest flow rate among all selected cases that have valid calculations.
   * Used to display the current limiting case on the main page.
   * 
   * Returns null if:
   * - No cases are selected
   * - No selected cases have completed calculations
   * - All calculated flows are null
   */
  const getDesignBasisFlow = () => {
    const calculatedCases = Object.values(caseResults).filter(
      result => result.isCalculated && result.asmeVIIIDesignFlow !== null && selectedCases[result.caseId]
    )
    
    if (calculatedCases.length === 0) return null
    
    const maxCase = calculatedCases.reduce((max, current) => 
      (current.asmeVIIIDesignFlow! > max.asmeVIIIDesignFlow!) ? current : max
    )
    
    return {
      flow: maxCase.asmeVIIIDesignFlow!,
      caseName: maxCase.caseName
    }
  }

  const getSelectedCaseCount = () => {
    return Object.values(selectedCases).filter(Boolean).length
  }

  const hasCalculatedResults = () => {
    return Object.values(caseResults).some(result => result.isCalculated)
  }

  return (
    <CaseContext.Provider value={{ 
      selectedCases, 
      caseResults,
      toggleCase, 
      updateCaseResult,
      getDesignBasisFlow,
      getSelectedCaseCount,
      hasCalculatedResults
    }}>
      {children}
    </CaseContext.Provider>
  )
}

export function useCase() {
  const context = useContext(CaseContext)
  if (context === undefined) {
    throw new Error('useCase must be used within a CaseProvider')
  }
  return context
}
