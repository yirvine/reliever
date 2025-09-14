'use client'

import { ReactNode, useEffect, useState } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`
      transition-opacity duration-200 ease-out
      ${isVisible ? 'opacity-100' : 'opacity-90'}
    `}>
      {children}
    </div>
  )
}
