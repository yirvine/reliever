'use client'

import { ReactNode, useEffect, useState } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Smooth fade in on mount
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`
      transition-opacity duration-300 ease-out
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      {children}
    </div>
  )
}
