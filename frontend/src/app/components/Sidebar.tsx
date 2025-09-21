"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from './SidebarLayout'

export default function Sidebar() {
  const { isExpanded, setIsExpanded } = useSidebar()
  const pathname = usePathname()

  const cases = [
    {
      id: 'external-fire' as const,
      name: '1 - External Fire',
      href: '/cases/external-fire',
    },
    {
      id: 'nitrogen-control' as const,
      name: '2 - Nitrogen Control',
      href: '/cases/nitrogen-failure',
    },
    {
      id: 'additional-cases' as const,
      name: '3 - Additional Cases',
      href: '#',
    }
  ]

  return (
    <div 
      className={`fixed left-0 top-[5.5rem] h-[calc(100vh-5.5rem)] app-sidebar-bg border-r app-sidebar-border shadow-sm transition-all duration-300 ease-in-out z-10 ${
        isExpanded ? 'w-52' : 'w-12'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 pt-4">
          {/* Calculator */}
          <Link 
            href="/calc" 
            className={`flex items-center px-2 py-1.5 rounded transition-all duration-150 group ${
              pathname === '/calc' 
                ? 'app-sidebar-active app-text-secondary' 
                : 'app-sidebar-hover app-text-secondary hover:app-text-primary'
            } justify-start`}
          >
            {isExpanded && (
              <span className="text-sm font-medium font-inter whitespace-nowrap overflow-hidden">
                Calculator
              </span>
            )}
          </Link>

          <div className="my-1 border-t app-border-light"></div>

          {/* Cases */}
          {cases.map((caseItem) => {
            const isActive = pathname === caseItem.href
            
            return (
              <div key={caseItem.id} className="space-y-1">
                <Link 
                  href={caseItem.href}
                  className={`flex items-center px-2 py-1.5 rounded transition-all duration-150 justify-start ${
                    isActive 
                      ? 'app-sidebar-active app-text-secondary' 
                      : 'app-sidebar-hover app-text-secondary hover:app-text-primary'
                  }`}
                >
                  {isExpanded && (
                    <span className="text-sm font-medium font-inter whitespace-nowrap overflow-hidden">
                      {caseItem.name}
                    </span>
                  )}
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        {isExpanded && (
          <div className="p-2 border-t app-border-light">
            <div className="text-sm app-text-muted font-inter whitespace-nowrap">
              v1.0.0 MVP
            </div>
          </div>
        )}
      </div>
    </div>
  )
}