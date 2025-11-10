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
      name: 'External Fire',
      href: '/cases/external-fire',
    },
    {
      id: 'control-valve-failure' as const,
      name: 'Control Valve Failure',
      href: '/cases/control-valve-failure',
    },
    {
      id: 'liquid-overfill' as const,
      name: 'Liquid Overfill',
      href: '/cases/liquid-overfill',
    },
    {
      id: 'blocked-outlet' as const,
      name: 'Blocked Outlet',
      href: '/cases/blocked-outlet',
    },
    {
      id: 'cooling-reflux-failure' as const,
      name: 'Cooling/Reflux Failure',
      href: '/cases/cooling-reflux-failure',
    },
    {
      id: 'hydraulic-expansion' as const,
      name: 'Hydraulic Expansion',
      href: '/cases/hydraulic-expansion',
    },
    {
      id: 'heat-exchanger-tube-rupture' as const,
      name: 'Heat Exchanger Tube Rupture',
      href: '/cases/heat-exchanger-tube-rupture',
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
          <div className="p-2 border-t border-gray-200 space-y-2">
            <div className="flex gap-3 text-xs text-gray-500 font-inter">
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">
                Terms
              </Link>
            </div>
            <div className="text-sm text-gray-500 font-inter whitespace-nowrap">
              linkedin.com/in/yene-irvine
            </div>
          </div>
        )}
      </div>
    </div>
  )
}