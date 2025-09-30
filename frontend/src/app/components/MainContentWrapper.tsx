"use client"

import { useSidebar } from './SidebarLayout'

interface MainContentWrapperProps {
  children: React.ReactNode
}

export default function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { isExpanded } = useSidebar()

  return (
    <main 
      className={`min-h-screen pt-[5.5rem] lg:transition-all lg:duration-300 lg:ease-in-out ${
        isExpanded ? 'lg:ml-60' : 'lg:ml-12'
      }`}
    >
      {children}
    </main>
  )
}
