'use client'

import Link from 'next/link'
import Image from 'next/image'
import NavDropdown from './NavDropdown'
import { useSidebar } from './SidebarLayout'

export default function Header() {
  const { isExpanded } = useSidebar()
  
  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
      isExpanded ? 'lg:!left-60' : 'lg:!left-12'
    }`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-6">
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/" className="hover:opacity-80 transition-opacity">
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
          </div>
          <div className="flex items-center space-x-0 sm:space-x-1">
            <NavDropdown 
              title="Cases" 
              href="/cases"
              items={[
                { label: 'External Fire', href: '/cases/external-fire' },
                { label: 'Control Valve Failure', href: '/cases/control-valve-failure' },
                { label: 'Liquid Overfill', href: '/cases/liquid-overfill' }
              ]} 
            />
            {/* Temporarily hidden About button - keeping logic for future use */}
            {/* <Link 
              href="/#how-it-works" 
              className="px-1 sm:px-3 py-2 text-xs sm:text-lg lg:text-xl font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 font-inter navbar-text"
            >
              About
            </Link> */}
            <NavDropdown 
              title="Datasets" 
              href="/datasets"
              items={[
                { label: 'Fluid Properties', href: '/datasets/fluids' },
                { label: 'Gas Properties', href: '/datasets/gas-properties' },
                { label: 'Vessel Head Areas', href: '/datasets/vessel-head-areas' }
              ]} 
            />
          </div>
        </div>
      </div>
    </header>
  )
}
