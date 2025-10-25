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
      id: 'liquid-overfill' as const,
      name: '3 - Liquid Overfill',
      href: '/cases/liquid-overfill',
    },
    {
      id: 'additional-cases' as const,
      name: '4 - Additional Cases',
      href: '#',
    }
  ]

  return (
    <div 
      className={`fixed left-0 top-[5.5rem] h-[calc(100vh-5.5rem)] bg-gray-50 border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out z-10 sidebar-desktop-show ${
        isExpanded ? 'w-60' : 'w-12'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 pt-4">
          {/* Cases */}
          <Link 
            href="/cases" 
            className={`flex items-center px-2 py-1.5 rounded transition-all duration-150 group ${
              pathname === '/cases' 
                ? 'bg-gray-200 text-gray-900' 
                : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            } justify-start`}
          >
            {isExpanded && (
              <span className="text-sm font-medium font-inter whitespace-nowrap overflow-hidden">
                Cases
              </span>
            )}
          </Link>

          <div className="my-1 border-t border-gray-200"></div>

          {/* Cases */}
          {cases.map((caseItem) => {
            const isActive = pathname === caseItem.href
            
            return (
              <div key={caseItem.id} className="space-y-1">
                <Link 
                  href={caseItem.href}
                  className={`flex items-center px-2 py-1.5 rounded transition-all duration-150 justify-start ${
                    isActive 
                      ? 'bg-gray-200 text-gray-900' 
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
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
          <div className="p-2 border-t border-gray-200">
            <div className="text-sm text-gray-500 font-inter whitespace-nowrap">
              v1.0.0 MVP
            </div>
          </div>
        )}
      </div>
    </div>
  )
}