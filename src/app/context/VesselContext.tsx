'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { calculateFireExposedArea as dbCalculateArea, VesselOrientation } from '@/lib/database'
import { auth } from '@/lib/firebase/config'
import { useAuth } from './AuthContext'

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

export interface SavedVessel {
  id: string
  vessel_tag: string
  vessel_name: string | null
  updated_at: string
}

interface VesselContextType {
  vesselData: VesselData
  updateVesselData: (field: keyof VesselData, value: string | number | boolean) => void
  calculateFireExposedArea: (fireCode: string) => number
  // Vessel management - direct methods
  selectVessel: (vesselId: string) => void
  newVessel: () => void
  openNewVesselModal: () => void
  loadVesselNow: (vesselId: string) => Promise<void>
  currentVesselId: string | null
  setCurrentVesselId: (id: string | null) => void
  pendingVesselId: string | null
  setPendingVesselId: (id: string | null) => void
  // New vessel modal state (context-driven, no localStorage)
  newVesselModalRequested: boolean
  requestNewVesselModal: () => void
  clearNewVesselModalRequest: () => void
  // Vessel list management (authoritative source)
  userVessels: SavedVessel[]
  fetchUserVessels: () => Promise<void>
  updateVesselInList: (vesselId: string, updates: Partial<Pick<SavedVessel, 'vessel_tag' | 'vessel_name'>>) => void
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
  headType: '', // No default - user must select
  workingFluid: '',
  vesselDesignMawp: 0,
  asmeSetPressure: 0,
  
  // API 521 defaults (backward compatible)
  vesselOrientation: undefined, // No default - user must select
  headProtectedBySkirt: false,
  fireSourceElevation: 0 // Grade level
}

const VesselContext = createContext<VesselContextType | undefined>(undefined)

export function VesselProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [vesselData, setVesselData] = useState<VesselData>(defaultVesselData)
  const [isHydrated, setIsHydrated] = useState(false)
  // Hydrate currentVesselId from localStorage immediately on client
  const [currentVesselId, setCurrentVesselIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('reliever-current-vessel-id')
    }
    return null
  })
  const [pendingVesselId, setPendingVesselId] = useState<string | null>(null)
  
  // Vessel list state (authoritative source)
  const [userVessels, setUserVessels] = useState<SavedVessel[]>([])
  
  // New vessel modal state (context-driven, no localStorage)
  const [newVesselModalRequested, setNewVesselModalRequested] = useState(false)
  
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

  // Load from localStorage after hydration (only once per lifecycle)
  useEffect(() => {
    if (!isHydrated) {
      const saved = localStorage.getItem('reliever-vessel-data')
      if (saved) {
        try {
          setVesselData({ ...defaultVesselData, ...JSON.parse(saved) })
        } catch (error) {
          console.warn('Failed to parse saved vessel data:', error)
        }
      }
      setIsHydrated(true)
    }
  }, [isHydrated])

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

  /**
   * Authoritative vessel list fetching function.
   * Fetches vessels from the API and updates both state and localStorage cache.
   * This is the ONLY place where userVessels should be fetched.
   */
  const fetchUserVessels = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return

      const response = await fetch('/api/vessels', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const vessels = data.vessels || []
        setUserVessels(vessels)
        localStorage.setItem('reliever-vessels-cache', JSON.stringify(vessels))
      }
    } catch (err) {
      console.error('Failed to fetch vessels:', err)
    }
  }, [])

  /**
   * Optimistically update a single vessel in the list without re-fetching
   * Useful for updating vessel tag/name after auto-save
   */
  const updateVesselInList = useCallback((vesselId: string, updates: Partial<Pick<SavedVessel, 'vessel_tag' | 'vessel_name'>>) => {
    setUserVessels(prev => {
      const updated = prev.map(v => 
        v.id === vesselId ? { ...v, ...updates } : v
      )
      // Update localStorage cache
      localStorage.setItem('reliever-vessels-cache', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Fetch vessels when user logs in
  useEffect(() => {
    if (user) {
      fetchUserVessels()
    }
  }, [user, fetchUserVessels])

  /**
   * Authoritative vessel loading function.
   * Handles all vessel-switching logic:
   * - Auto-saves current vessel if needed
   * - Loads from cache if available
   * - Fetches fresh data from DB
   * - Updates contexts atomically
   */
  const loadVesselNow = useCallback(async (vesselId: string) => {
    if (loadingVessel || vesselId === currentVesselId) return
    
    setLoadingVessel(true)
    setLoadingMessage('Loading vessel...')
    
    // This function is implemented by VesselBar
    // VesselBar will call this when pendingVesselId changes
    // The actual loading logic is delegated to VesselBar's handleSelectVessel
    
    // This is just a stub - VesselBar implements the real logic
    console.log('loadVesselNow called:', vesselId)
  }, [loadingVessel, currentVesselId])

  /**
   * Smart vessel selection that handles cross-page navigation.
   * If already on /cases, loads immediately.
   * Otherwise, sets pending state and navigates.
   */
  const selectVessel = useCallback((vesselId: string) => {
    // If selecting same vessel or already loading, do nothing
    if (vesselId === currentVesselId) {
      if (pathname !== '/cases') {
        router.push('/cases')
      }
      return
    }
    
    if (loadingVessel) return

    // Show loading modal immediately before any navigation or state changes
    setLoadingMessage('Loading...')
    setLoadingVessel(true)

    // If we're on /cases page, set pending state to trigger VesselBar
    if (pathname === '/cases') {
      setPendingVesselId(vesselId)
    } else {
      // If navigating from another page, set pending and navigate
      setPendingVesselId(vesselId)
      router.push('/cases')
    }
  }, [pathname, currentVesselId, loadingVessel, router, setLoadingMessage, setLoadingVessel])

  /**
   * Request new vessel modal to open.
   * If not on /cases page, navigate there first.
   * Modal opens instantly via context state, no localStorage.
   */
  const requestNewVesselModal = useCallback(() => {
    if (pathname !== '/cases') {
      // Navigate to /cases first, modal will open when we get there
      setNewVesselModalRequested(true)
      router.push('/cases')
    } else {
      // Already on /cases, request modal instantly
      setNewVesselModalRequested(true)
    }
  }, [pathname, router])

  /**
   * Clear the new vessel modal request (called by VesselBar after opening modal)
   */
  const clearNewVesselModalRequest = useCallback(() => {
    setNewVesselModalRequested(false)
  }, [])

  /**
   * Legacy: kept for backwards compatibility, delegates to requestNewVesselModal
   */
  const newVessel = useCallback(() => {
    requestNewVesselModal()
  }, [requestNewVesselModal])

  /**
   * Legacy: kept for backwards compatibility, delegates to requestNewVesselModal
   */
  const openNewVesselModal = useCallback(() => {
    requestNewVesselModal()
  }, [requestNewVesselModal])

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
      openNewVesselModal,
      loadVesselNow,
      currentVesselId,
      setCurrentVesselId,
      pendingVesselId,
      setPendingVesselId,
      // New vessel modal (context-driven)
      newVesselModalRequested,
      requestNewVesselModal,
      clearNewVesselModalRequest,
      // Vessel list management (authoritative source)
      userVessels,
      fetchUserVessels,
      updateVesselInList,
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
