'use client'

import { useState } from 'react'
import Link from 'next/link'

interface DropdownItem {
  label: string
  href: string
}

interface NavDropdownProps {
  title: string
  items: DropdownItem[]
  href?: string // Optional href for the title itself
}

export default function NavDropdown({ title, items, href }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {href ? (
        <Link 
          href={href}
          className="text-gray-700 hover:text-blue-600 px-1 sm:px-3 py-2 text-xs sm:text-lg lg:text-xl font-medium transition-colors duration-200 font-inter navbar-text inline-flex items-center"
        >
          {title}
        </Link>
      ) : (
        <button className="text-gray-700 hover:text-blue-600 px-1 sm:px-3 py-2 text-xs sm:text-lg lg:text-xl font-medium transition-colors duration-200 font-inter navbar-text inline-flex items-center">
          {title}
        </button>
      )}
      
      <div className={`
        absolute top-full right-0 mt-0 w-48 sm:w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50
        transition-all duration-200 ease-in-out transform origin-top-right
        ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
      `}>
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="block px-4 py-3 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 font-inter"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
