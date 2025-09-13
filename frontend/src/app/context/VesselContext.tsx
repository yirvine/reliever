'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface VesselData {
  vesselTag: string
  straightSideHeight: number
  vesselDiameter: number
  headType: string
  workingFluid: string
  vesselDesignMawp: number
  maxAllowedVentingPressure: number
  asmeSetPressure: number
  maxAllowableBackpressure: number
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
  maxAllowedVentingPressure: 0,
  asmeSetPressure: 0,
  maxAllowableBackpressure: 0
}

const VesselContext = createContext<VesselContextType | undefined>(undefined)

export function VesselProvider({ children }: { children: ReactNode }) {
  const [vesselData, setVesselData] = useState<VesselData>(defaultVesselData)

  const updateVesselData = (field: keyof VesselData, value: string | number) => {
    setVesselData(prev => ({ ...prev, [field]: value }))
  }

  // Simple fire exposed area calculation based on vessel dimensions
  const calculateFireExposedArea = (fireCode: string): number => {
    const { vesselDiameter, straightSideHeight } = vesselData
    
    if (!vesselDiameter || !straightSideHeight) return 0
    
    const radius = vesselDiameter / 2 / 12 // Convert inches to feet
    const height = straightSideHeight / 12 // Convert inches to feet
    
    // Simplified calculation - cylindrical surface area
    const cylindricalArea = 2 * Math.PI * radius * height
    const headArea = Math.PI * radius * radius // One head (bottom typically exposed)
    
    return cylindricalArea + headArea
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
