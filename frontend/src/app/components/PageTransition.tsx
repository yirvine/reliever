'use client'

import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  // Simple wrapper - no transitions to avoid black flash
  return (
    <div>
      {children}
    </div>
  )
}
