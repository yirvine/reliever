"use client"

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import ToggleSwitch from './ToggleSwitch'
import { useCase } from '../context/CaseContext'
import { useSidebar } from './SidebarLayout'

export default function Sidebar() {
  const { selectedCases, toggleCase } = useCase()
  const { isExpanded, setIsExpanded } = useSidebar()
  const pathname = usePathname()

  const cases = [
    {
      id: 'external-fire' as const,
      name: 'External Fire',
      href: '/cases/external-fire',
      color: 'bg-red-100 text-red-700 border-red-200'
    },
    {
      id: 'nitrogen-control' as const,
      name: 'Nitrogen Control',
      href: '/cases/nitrogen-failure',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      id: 'additional-cases' as const,
      name: 'Additional Cases',
      href: '#',
      color: 'bg-green-100 text-green-700 border-green-200'
    }
  ]

  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out z-40 ${
        isExpanded ? 'w-52' : 'w-12'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-2 border-b border-gray-100">
          <div className="flex items-center">
            <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
              <Image 
                src="/ReliefGuardLogoTransparent.png" 
                alt="ReliefGuard" 
                width={28} 
                height={28} 
                className="h-7 w-7 object-contain"
                priority
              />
            </div>
            {isExpanded && (
              <div className="ml-3 overflow-hidden transition-all duration-300 ease-in-out">
                <h2 className="text-base font-semibold text-gray-800 font-inter whitespace-nowrap">Cases</h2>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {/* Home */}
          <Link 
            href="/" 
            className={`flex items-center px-2 py-1.5 rounded transition-all duration-150 group ${
              pathname === '/' 
                ? 'bg-slate-50 text-slate-700' 
                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
            } justify-start`}
          >
            {isExpanded && (
              <span className="text-sm font-medium font-inter whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">
                Home
              </span>
            )}
          </Link>

          <div className="my-1 border-t border-gray-100"></div>

          {/* Cases */}
          {cases.map((caseItem) => {
            const isActive = pathname === caseItem.href
            const isEnabled = selectedCases[caseItem.id]
            
            return (
              <div key={caseItem.id} className="space-y-1">
                <div className={`flex items-center rounded transition-all duration-150 ${
                  isActive 
                    ? 'bg-slate-50' 
                    : 'hover:bg-gray-50'
                } ${!isEnabled ? 'opacity-40' : ''}`}>
                  
                  <Link 
                    href={caseItem.href}
                    className={`flex items-center px-2 py-1.5 flex-1 rounded transition-all duration-150 justify-start ${
                      isActive 
                        ? 'text-slate-700' 
                        : isEnabled 
                          ? 'text-gray-700 hover:text-gray-900' 
                          : 'text-gray-400'
                    }`}
                  >
                    {isExpanded && (
                      <span className="text-sm font-medium font-inter whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">
                        {caseItem.name}
                      </span>
                    )}
                  </Link>

                  {isExpanded && (
                    <div className="pr-1 flex-shrink-0 transition-all duration-300 ease-in-out">
                      <ToggleSwitch
                        enabled={isEnabled}
                        onChange={() => toggleCase(caseItem.id)}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        {isExpanded && (
          <div className="p-2 border-t border-gray-100 transition-all duration-300 ease-in-out">
            <div className="text-sm text-gray-400 font-inter whitespace-nowrap">
              v1.0.0 MVP
            </div>
          </div>
        )}
      </div>
    </div>
  )
}