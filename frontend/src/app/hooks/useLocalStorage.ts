import { useState, useEffect } from 'react'

/**
 * Custom hook for managing localStorage with automatic sync
 * Handles JSON serialization/deserialization and error recovery
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Error loading ${key} from localStorage:`, error)
    }
    setIsLoaded(true)
  }, [key])

  // Save to localStorage whenever value changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(key, JSON.stringify(storedValue))
      } catch (error) {
        console.warn(`Error saving ${key} to localStorage:`, error)
      }
    }
  }, [key, storedValue, isLoaded])

  return [storedValue, setStoredValue] as const
}

