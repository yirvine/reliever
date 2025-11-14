'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { calculateFireExposedArea as dbCalculateArea, VesselOrientation } from '@/lib/database'

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
  // Vessel management - direct methods
  selectVessel: (vesselId: string) => Promise<void>
  newVessel: () => void
  currentVesselId: string | null
  setCurrentVesselId: (id: string | null) => void
  // Trigger to refresh vessel lists
  vesselsUpdatedTrigger: number
  triggerVesselsUpdate: () => void
  // Loading state
  loadingVessel: boolean
  setLoadingVessel: (loading: boolean) => void
  loadingMessage: string
  setLoadingMessage: (message: string) => void
  // Save callback registration
  saveCurrentVessel: (() => Promise<boolean>) | null
  registerSaveCallback: (callback: () => Promise<boolean>) => void
  isHydrated: boolean
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
  const router = useRouter()
  const [vesselData, setVesselData] = useState<VesselData>(defaultVesselData)
  const [isHydrated, setIsHydrated] = useState(false)
  // Start with null to match SSR, then hydrate from cache
  const [currentVesselId, setCurrentVesselIdState] = useState<string | null>(null)
  
  // Hydrate currentVesselId from localStorage after mount (client-side only)
  useEffect(() => {
    const cached = localStorage.getItem('reliever-current-vessel-id')
    if (cached) {
      setCurrentVesselIdState(cached)
    }
  }, [])
  
  // Wrapper to persist currentVesselId to localStorage
  const setCurrentVesselId = (id: string | null) => {
    setCurrentVesselIdState(id)
    if (id) {
      localStorage.setItem('reliever-current-vessel-id', id)
    } else {
      localStorage.removeItem('reliever-current-vessel-id')
    }
  }
  
  const [vesselsUpdatedTrigger, setVesselsUpdatedTrigger] = useState(0)
  const [loadingVessel, setLoadingVessel] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Loading vessel...')
  const [saveCallback, setSaveCallback] = useState<((silent?: boolean, vesselSnapshot?: VesselData, vesselIdSnapshot?: string) => Promise<boolean>) | null>(null)

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

  const triggerVesselsUpdate = () => {
    setVesselsUpdatedTrigger(prev => prev + 1)
  }

  const registerSaveCallback = (callback: (silent?: boolean, vesselSnapshot?: VesselData, vesselIdSnapshot?: string) => Promise<boolean>) => {
    setSaveCallback(() => callback)
  }

  // Direct vessel selection method (works from any page)
  const selectVessel = async (vesselId: string) => {
    // If selecting same vessel or already loading, navigate to cases
    if (vesselId === currentVesselId) {
      router.push('/cases')
      return
    }
    
    if (loadingVessel) {
      return
    }

    // Set a "pending vessel" flag so VesselBar knows to load this vessel when it mounts
    localStorage.setItem('reliever-pending-vessel-id', vesselId)

    // Navigate to cases page - VesselBar will detect pending vessel and load it
    router.push('/cases')
  }

  const newVessel = () => {
    // Set a flag so VesselBar knows to show the new vessel modal
    localStorage.setItem('reliever-new-vessel-requested', 'true')
    // Navigate to cases page if not already there
    router.push('/cases')
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
    <VesselContext.Provider value={{ 
      vesselData, 
      updateVesselData, 
      calculateFireExposedArea,
      // Vessel management
      selectVessel,
      newVessel,
      currentVesselId,
      setCurrentVesselId,
      vesselsUpdatedTrigger,
      triggerVesselsUpdate,
      loadingVessel,
      setLoadingVessel,
      loadingMessage,
      setLoadingMessage,
      saveCurrentVessel: saveCallback,
      registerSaveCallback,
      isHydrated
    }}>
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
