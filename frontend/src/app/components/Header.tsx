'use client'

import Link from 'next/link'
import Image from 'next/image'
import NavDropdown from './NavDropdown'
import { useSidebar } from './SidebarLayout'

interface HeaderProps {
  showBreadcrumb?: boolean
  breadcrumbText?: string
}

export default function Header({ showBreadcrumb = false, breadcrumbText }: HeaderProps) {
  const { isExpanded } = useSidebar()
  
  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 z-50 transition-all duration-300 ease-in-out ${
      isExpanded ? 'left-60' : 'left-12'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/calc" className="hover:opacity-80 transition-opacity">
              <div className="logo-container">
                <Image 
                  src="/ReliefGuardBannerTransparent.png" 
                  alt="ReliefGuard" 
                  width={200} 
                  height={50} 
                  className="h-10 w-auto"
                  priority
                  sizes="240px"
                />
              </div>
            </Link>
            <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">MVP</span>
            {showBreadcrumb && breadcrumbText && (
              <span className="ml-4 text-lg text-gray-600">/ {breadcrumbText}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Link 
              href="/calc" 
              className="px-3 py-2 text-xl font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 font-inter navbar-text"
            >
              Home
            </Link>
            <NavDropdown 
              title="About" 
              items={[
                { label: 'What is ReliefGuard?', href: '#' },
                { label: 'Help', href: '#' }
              ]} 
            />
            <NavDropdown 
              title="Data" 
              items={[
                { label: 'Calculations', href: '#' },
                { label: 'Fluid Properties', href: '#' },
                { label: 'Vessel Head Area Table', href: '#' }
              ]} 
            />
          </div>
        </div>
      </div>
    </header>
  )
}
