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
    <header className={`bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
      isExpanded ? 'lg:!left-60' : 'lg:!left-12'
    }`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-6">
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/calc" className="hover:opacity-80 transition-opacity">
              <div className="logo-container">
                <Image 
                  src="/ReliefGuardBannerTransparent.png" 
                  alt="ReliefGuard" 
                  width={200} 
                  height={50} 
                  className="h-5 sm:h-8 lg:h-10 w-auto"
                  priority
                  sizes="(max-width: 640px) 100px, (max-width: 1024px) 160px, 200px"
                />
              </div>
            </Link>
            <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500 bg-gray-100 px-1 sm:px-2 py-1 rounded">MVP</span>
            {showBreadcrumb && breadcrumbText && (
              <span className="ml-2 sm:ml-4 text-sm sm:text-lg text-gray-600 hidden sm:block">/ {breadcrumbText}</span>
            )}
          </div>
          <div className="flex items-center space-x-0 sm:space-x-1">
            <Link 
              href="/calc" 
              className="px-1 sm:px-3 py-2 text-xs sm:text-lg lg:text-xl font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 font-inter navbar-text min-w-[2.5rem] sm:min-w-0"
            >
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
            <Link 
              href="/#how-it-works" 
              className="px-1 sm:px-3 py-2 text-xs sm:text-lg lg:text-xl font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 font-inter navbar-text"
            >
              About
            </Link>
            <NavDropdown 
              title="Data" 
              items={[
                { label: 'Fluid Properties', href: '/data/fluid-properties' },
                { label: 'Vessel Head Areas', href: '/data/vessel-head-areas' }
              ]} 
            />
          </div>
        </div>
      </div>
    </header>
  )
}
