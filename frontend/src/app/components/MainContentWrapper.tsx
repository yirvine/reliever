"use client"

import { useSidebar } from './SidebarLayout'

interface MainContentWrapperProps {
  children: React.ReactNode
}

export default function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { isExpanded } = useSidebar()

  return (
    <main 
      className={`min-h-screen pt-[5.5rem] transition-all duration-300 ease-in-out ${
        isExpanded ? 'ml-60' : 'ml-12'
      }`}
    >
      {children}
    </main>
  )
}
