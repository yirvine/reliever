'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export interface CaseResult {
  caseId: string
  caseName: string
  asmeVIIIDesignFlow: number | null
  isCalculated: boolean
}

interface CaseContextType {
  selectedCases: { [key: string]: boolean }
  caseResults: { [key: string]: CaseResult }
  toggleCase: (caseId: string) => void
  updateCaseResult: (caseId: string, result: Partial<CaseResult>) => void
  getDesignBasisFlow: () => { flow: number; caseName: string } | null
  getSelectedCaseCount: () => number
  hasCalculatedResults: () => boolean
}

const defaultCases = {
  'external-fire': false,
  'nitrogen-control': false,
  'additional-cases': false
}

const defaultCaseResults: { [key: string]: CaseResult } = {
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
  }
}

const CaseContext = createContext<CaseContextType | undefined>(undefined)

export function CaseProvider({ children }: { children: ReactNode }) {
  const [selectedCases, setSelectedCases] = useState(defaultCases)
  const [caseResults, setCaseResults] = useState(defaultCaseResults)

  const toggleCase = (caseId: string) => {
    setSelectedCases(prev => ({
      ...prev,
      [caseId]: !prev[caseId]
    }))
  }

  const updateCaseResult = useCallback((caseId: string, result: Partial<CaseResult>) => {
    setCaseResults(prev => ({
      ...prev,
      [caseId]: { ...prev[caseId], ...result }
    }))
  }, [])

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
