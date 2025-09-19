'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const scrollPositions = new Map<string, number>()

export function useScrollPosition() {
  const pathname = usePathname()
  const previousPathnameRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Save scroll position for previous pathname
    if (previousPathnameRef.current && previousPathnameRef.current !== pathname) {
      scrollPositions.set(previousPathnameRef.current, window.scrollY)
    }
    
    // Restore scroll position for current pathname
    const savedPosition = scrollPositions.get(pathname) || 0
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      window.scrollTo(0, savedPosition)
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
