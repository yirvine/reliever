'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { calculateFireExposedArea as dbCalculateArea } from '../../../lib/database'

export interface VesselData {
  vesselTag: string
  straightSideHeight: number
  vesselDiameter: number
  headType: string
  workingFluid: string
  vesselDesignMawp: number
  asmeSetPressure: number
}

interface VesselContextType {
  vesselData: VesselData
  updateVesselData: (field: keyof VesselData, value: string | number) => void
  calculateFireExposedArea: (fireCode: string) => number
}

const defaultVesselData: VesselData = {
  vesselTag: '',
  straightSideHeight: 0,
  vesselDiameter: 0,
  headType: 'Hemispherical',
  workingFluid: '',
  vesselDesignMawp: 0,
  asmeSetPressure: 0
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

  const updateVesselData = (field: keyof VesselData, value: string | number) => {
    setVesselData(prev => ({ ...prev, [field]: value }))
  }

  // Fire exposed area calculation using database lookup tables
  const calculateFireExposedArea = (fireCode: string): number => {
    const { vesselDiameter, straightSideHeight, headType } = vesselData
    
    if (!vesselDiameter || !straightSideHeight) return 0
    
    try {
      return dbCalculateArea(
        vesselDiameter,
        straightSideHeight,
        headType as 'Elliptical' | 'Hemispherical' | 'Flat',
        fireCode as 'NFPA 30' | 'API 521'
      )
    } catch (error) {
      console.warn('Database calculation failed, using fallback:', error)
      // Fallback to simple calculation
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
