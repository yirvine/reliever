'use client'

import Link from 'next/link'
import Image from 'next/image'
import NavDropdown from './NavDropdown'

interface HeaderProps {
  showBreadcrumb?: boolean
  breadcrumbText?: string
}

export default function Header({ showBreadcrumb = false, breadcrumbText }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/ReliefGuardBannerTransparent.png" 
                alt="ReliefGuard" 
                width={200} 
                height={50} 
                className="h-8 w-auto"
              />
            </Link>
            <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">MVP</span>
            {showBreadcrumb && breadcrumbText && (
              <span className="ml-4 text-lg text-gray-600">/ {breadcrumbText}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
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
