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
export type CaseId = 'external-fire' | 'control-valve-failure' | 'liquid-overfill' | 'blocked-outlet' | 'cooling-reflux-failure' | 'hydraulic-expansion' | 'heat-exchanger-tube-rupture'

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
  refreshFromStorage: () => void            // Refresh case data from localStorage (for vessel switches)
  isHydrated: boolean                       // Whether initial localStorage load is complete
  applyCaseData: (selected: Record<CaseId, boolean>, results: Record<CaseId, CaseResult>) => void  // Apply case data from external source (vessel loading)
}

const defaultCases = {
  'external-fire': false,
  'control-valve-failure': false,
  'liquid-overfill': false,
  'blocked-outlet': false,
  'cooling-reflux-failure': false,
  'hydraulic-expansion': false,
  'heat-exchanger-tube-rupture': false
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
  },
  'heat-exchanger-tube-rupture': {
    caseId: 'heat-exchanger-tube-rupture',
    caseName: 'Heat Exchanger Tube Rupture',
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

  // NOTE: These auto-sync useEffects have been REMOVED to eliminate race conditions.
  // VesselBar is now the ONLY writer for reliever-selected-cases and reliever-case-results.
  // CaseContext only reads at hydration and updates via applyCaseData().
  
  // REMOVED: Auto-sync to localStorage on selectedCases change (was causing overwrites)
  // REMOVED: Auto-sync to localStorage on caseResults change (was causing overwrites)

  /**
   * Toggle a case's selected state.
   * This affects whether the case contributes to the design basis flow
   * and whether its page is interactive.
   * 
   * CRITICAL: Persists to localStorage immediately using single-writer pattern.
   */
  const toggleCase = (caseId: CaseId) => {
    setSelectedCases(prev => {
      const updated = {
        ...prev,
        [caseId]: !prev[caseId]
      }
      
      // Persist to localStorage immediately (single writer for selected-cases)
      console.log('[DBG] toggleCase: persisting to localStorage - caseId =', caseId, 'newState =', updated[caseId])
      localStorage.setItem('reliever-selected-cases', JSON.stringify(updated))
      
      return updated
    })
  }

  /**
   * Update calculation results for a specific case.
   * Memoized to prevent unnecessary re-renders in child components.
   * Partial updates are allowed to avoid overwriting unrelated fields.
   * 
   * CRITICAL: Persists to localStorage immediately using single-writer pattern.
   * This ensures case results are saved when calculations complete, without
   * requiring manual save or waiting for vessel switch.
   */
  const updateCaseResult = useCallback((caseId: CaseId, result: Partial<CaseResult>) => {
    setCaseResults(prev => {
      const updated = {
        ...prev,
        [caseId]: { ...prev[caseId], ...result }
      }
      
      // Persist to localStorage immediately (single writer for case-results)
      console.log('[DBG] updateCaseResult: persisting to localStorage - caseId =', caseId, 'result =', result)
      localStorage.setItem('reliever-case-results', JSON.stringify(updated))
      
      return updated
    })
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
    console.log('[DBG] getDesignBasisFlow: selectedCases =', selectedCases)
    console.log('[DBG] getDesignBasisFlow: caseResults =', caseResults)
    
    const calculatedCases = Object.values(caseResults).filter(
      result => result.isCalculated && result.asmeVIIIDesignFlow !== null && selectedCases[result.caseId]
    )
    
    if (calculatedCases.length === 0) {
      console.log('[DBG] getDesignBasisFlow: NO calculated cases found')
      return null
    }
    
    const maxCase = calculatedCases.reduce((max, current) => 
      (current.asmeVIIIDesignFlow! > max.asmeVIIIDesignFlow!) ? current : max
    )
    
    console.log('[DBG] getDesignBasisFlow: returning flow =', maxCase.asmeVIIIDesignFlow, 'from case =', maxCase.caseId)
    
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

  /**
   * DEPRECATED: This function is NO LONGER NEEDED.
   * 
   * Previously used to refresh case data from localStorage when switching vessels.
   * Now DISABLED because:
   * - VesselBar writes case data using applyCaseData() which updates both state + localStorage
   * - CaseContext hydrates once on mount
   * - No need to re-read from localStorage (causes race conditions)
   * 
   * Kept for backwards compatibility but does nothing.
   */
  const refreshFromStorage = useCallback(() => {
    console.log('[DBG] refreshFromStorage: DISABLED (no-op) - case data managed by applyCaseData')
    // DO NOTHING - VesselBar is the single writer via applyCaseData
  }, [])

  /**
   * Apply case data directly from external source (e.g., vessel loading).
   * This is the ONLY way VesselBar should update case selections and results.
   * Merges with defaults to ensure all case keys exist.
   * 
   * CRITICAL: This function is the SINGLE WRITER for localStorage case data.
   * It updates both React state AND localStorage atomically to prevent races.
   */
  const applyCaseData = useCallback((
    selected: Record<CaseId, boolean>,
    results: Record<CaseId, CaseResult>
  ) => {
    console.log('[DBG] applyCaseData: incoming selected =', selected)
    console.log('[DBG] applyCaseData: incoming results =', results)
    
    // CRITICAL: REPLACE entire state (don't merge with current)
    // This is called when loading a vessel, so incoming data IS the truth
    const mergedSelected = { ...defaultCases, ...selected }
    const mergedResults = { ...defaultCaseResults, ...results }
    
    console.log('[DBG] applyCaseData: writing selectedCases to localStorage =', mergedSelected)
    console.log('[DBG] applyCaseData: writing caseResults to localStorage =', mergedResults)
    
    setSelectedCases(mergedSelected)
    setCaseResults(mergedResults)
    
    localStorage.setItem('reliever-selected-cases', JSON.stringify(mergedSelected))
    localStorage.setItem('reliever-case-results', JSON.stringify(mergedResults))
    
    console.log('[DBG] applyCaseData: state + localStorage updated atomically')
  }, [])

  return (
    <CaseContext.Provider value={{ 
      selectedCases, 
      caseResults,
      toggleCase, 
      updateCaseResult,
      getDesignBasisFlow,
      getSelectedCaseCount,
      hasCalculatedResults,
      refreshFromStorage,
      isHydrated,
      applyCaseData
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
