'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { calculateFireExposedArea as dbCalculateArea, VesselOrientation } from '../../../lib/database'

/**
 * Vessel Data Interface
 * 
 * Enhanced with API 521 compliance parameters:
 * - vesselOrientation: Affects wetted surface area calculation
 * - headProtectedBySkirt: Excludes bottom head from fire exposure
 * - fireSourceElevation: Base level for 25 ft height limit (API 521)
 */
export interface VesselData {
  vesselTag: string
  vesselName?: string // Optional vessel name
  straightSideHeight: number
  vesselDiameter: number
  headType: string
  workingFluid: string
  vesselDesignMawp: number
  asmeSetPressure: number
  
  // API 521 enhancements (Priority 1)
  vesselOrientation?: VesselOrientation // Default: 'vertical'
  headProtectedBySkirt?: boolean // Default: false
  fireSourceElevation?: number // feet, default: 0 (grade level)
}

interface VesselContextType {
  vesselData: VesselData
  updateVesselData: (field: keyof VesselData, value: string | number | boolean) => void
  calculateFireExposedArea: (fireCode: string) => number
}

const defaultVesselData: VesselData = {
  vesselTag: '',
  vesselName: '',
  straightSideHeight: 0,
  vesselDiameter: 0,
  headType: 'Hemispherical',
  workingFluid: '',
  vesselDesignMawp: 0,
  asmeSetPressure: 0,
  
  // API 521 defaults (backward compatible)
  vesselOrientation: 'vertical',
  headProtectedBySkirt: false,
  fireSourceElevation: 0 // Grade level
}

const VesselContext = createContext<VesselContextType | undefined>(undefined)

export function VesselProvider({ children }: { children: ReactNode }) {
  const [vesselData, setVesselData] = useState<VesselData>(defaultVesselData)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('reliever-vessel-data')
    if (saved) {
      try {
        setVesselData({ ...defaultVesselData, ...JSON.parse(saved) })
      } catch (error) {
        console.warn('Failed to parse saved vessel data:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save vessel data to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('reliever-vessel-data', JSON.stringify(vesselData))
    }
  }, [vesselData, isHydrated])

  const updateVesselData = (field: keyof VesselData, value: string | number | boolean) => {
    setVesselData(prev => ({ ...prev, [field]: value }))
  }

  /**
   * Calculate fire exposed area using enhanced API 521 compliant method
   * 
   * Supports:
   * - 25 ft height limitation (API 521 §4.4.13.2.2)
   * - Vessel orientation (vertical, horizontal, sphere)
   * - Support skirt exclusion
   * - Configurable fire source elevation
   */
  const calculateFireExposedArea = (fireCode: string): number => {
    const { 
      vesselDiameter, 
      straightSideHeight, 
      headType,
      vesselOrientation = 'vertical',
      headProtectedBySkirt = false,
      fireSourceElevation = 0
    } = vesselData
    
    if (!vesselDiameter || !straightSideHeight) return 0
    
    try {
      return dbCalculateArea({
        vesselDiameter,
        straightSideHeight,
        headType: headType as 'Elliptical' | 'Hemispherical' | 'Flat',
        fireCode: fireCode as 'NFPA 30' | 'API 521',
        vesselOrientation,
        headProtectedBySkirt,
        fireSourceElevation
      })
    } catch (error) {
      console.warn('Database calculation failed, using fallback:', error)
      // Fallback to simple calculation (backward compatible)
      const radius = vesselDiameter / 2 / 12
      const height = straightSideHeight / 12
      const cylindricalArea = 2 * Math.PI * radius * height
      const headArea = Math.PI * radius * radius
      return cylindricalArea + headArea
    }
  }

  return (
    <VesselContext.Provider value={{ vesselData, updateVesselData, calculateFireExposedArea }}>
      {children}
    </VesselContext.Provider>
  )
}

export function useVessel() {
  const context = useContext(VesselContext)
  if (context === undefined) {
    throw new Error('useVessel must be used within a VesselProvider')
  }
  return context
}
