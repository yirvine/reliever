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
export type CaseId = 'external-fire' | 'control-valve-failure' | 'liquid-overfill' | 'blocked-outlet' | 'cooling-reflux-failure' | 'hydraulic-expansion'

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
  getDesignBasisFlow: () => { flow: number; caseName: string; caseId: CaseId } | null      // Get highest flow
  getSelectedCaseCount: () => number        // Count of active cases
  hasCalculatedResults: () => boolean       // Whether any calculations exist
}

const defaultCases = {
  'external-fire': false,
  'control-valve-failure': false,
  'liquid-overfill': false,
  'blocked-outlet': false,
  'cooling-reflux-failure': false,
  'hydraulic-expansion': false
}

const defaultCaseResults: Record<CaseId, CaseResult> = {
  'external-fire': {
    caseId: 'external-fire',
    caseName: 'External Fire',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  },
  'control-valve-failure': {
    caseId: 'control-valve-failure',
    caseName: 'Control Valve Failure (Gas)',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  },
  'liquid-overfill': {
    caseId: 'liquid-overfill',
    caseName: 'Liquid Overfill',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  },
  'blocked-outlet': {
    caseId: 'blocked-outlet',
    caseName: 'Blocked Outlet',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  },
  'cooling-reflux-failure': {
    caseId: 'cooling-reflux-failure',
    caseName: 'Cooling/Reflux Failure',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  },
  'hydraulic-expansion': {
    caseId: 'hydraulic-expansion',
    caseName: 'Hydraulic Expansion',
    asmeVIIIDesignFlow: null,
    isCalculated: false
  }
}

const CaseContext = createContext<CaseContextType | undefined>(undefined)

export function CaseProvider({ children }: { children: ReactNode }) {
  const [selectedCases, setSelectedCases] = useState(defaultCases)
  const [caseResults, setCaseResults] = useState(defaultCaseResults)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration
  useEffect(() => {
    // MIGRATION: Clean up old 'nitrogen-control' case data and rename to 'control-valve-failure'
    const migrateOldCaseData = () => {
      const savedCaseResults = localStorage.getItem('reliever-case-results')
      if (savedCaseResults) {
        try {
          const parsed = JSON.parse(savedCaseResults)
          // If old 'nitrogen-control' key exists, migrate it to new key
          if (parsed['nitrogen-control']) {
            console.log('Migrating old nitrogen-control data to control-valve-failure')
            parsed['control-valve-failure'] = {
              ...parsed['nitrogen-control'],
              caseId: 'control-valve-failure',
              caseName: 'Control Valve Failure (Gas)'
            }
            delete parsed['nitrogen-control']
            localStorage.setItem('reliever-case-results', JSON.stringify(parsed))
            return parsed
          }
          return parsed
        } catch (error) {
          console.warn('Migration failed:', error)
          return null
        }
      }
      return null
    }

    const savedSelectedCases = localStorage.getItem('reliever-selected-cases')
    if (savedSelectedCases) {
      try {
        const parsed = JSON.parse(savedSelectedCases)
        // Migrate selected case toggle
        if (parsed['nitrogen-control'] !== undefined) {
          parsed['control-valve-failure'] = parsed['nitrogen-control']
          delete parsed['nitrogen-control']
          localStorage.setItem('reliever-selected-cases', JSON.stringify(parsed))
        }
        setSelectedCases({ ...defaultCases, ...parsed })
      } catch (error) {
        console.warn('Failed to parse saved selected cases:', error)
      }
    }

    // Run migration and load results
    const migratedResults = migrateOldCaseData()
    if (migratedResults) {
      setCaseResults({ ...defaultCaseResults, ...migratedResults })
    } else {
      const savedCaseResults = localStorage.getItem('reliever-case-results')
      if (savedCaseResults) {
        try {
          setCaseResults({ ...defaultCaseResults, ...JSON.parse(savedCaseResults) })
        } catch (error) {
          console.warn('Failed to parse saved case results:', error)
        }
      }
    }

    // Clean up old localStorage keys
    localStorage.removeItem('nitrogen-control-flow-data')
    localStorage.removeItem('nitrogen-control-pressure-data')

    setIsHydrated(true)
  }, [])

  // Save selected cases to localStorage whenever they change (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('reliever-selected-cases', JSON.stringify(selectedCases))
    }
  }, [selectedCases, isHydrated])

  // Save case results to localStorage whenever they change (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('reliever-case-results', JSON.stringify(caseResults))
    }
  }, [caseResults, isHydrated])

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
      caseName: maxCase.caseName,
      caseId: maxCase.caseId
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
