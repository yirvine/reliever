'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const scrollPositions = new Map<string, number>()

export function useScrollPosition() {
  const pathname = usePathname()
  const previousPathnameRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Skip scroll position restoration on mobile entirely
    if (window.innerWidth < 1024) {
      return
    }

    // Save scroll position for previous pathname
    if (previousPathnameRef.current && previousPathnameRef.current !== pathname) {
      scrollPositions.set(previousPathnameRef.current, window.scrollY)
    }
    
    // Restore scroll position for current pathname
    const savedPosition = scrollPositions.get(pathname) || 0
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      if (savedPosition > 0) {
        window.scrollTo(0, savedPosition)
      }
    })

    // Update previous pathname
    previousPathnameRef.current = pathname

    // Save scroll position on scroll
    const handleScroll = () => {
      scrollPositions.set(pathname, window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [pathname])
}
