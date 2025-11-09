'use client'

import Link from 'next/link'

interface CaseBreadcrumbProps {
  caseName: string
}

/**
 * Reusable breadcrumb navigation for case pages
 * Shows: Cases › [Case Name]
 */
export default function CaseBreadcrumb({ caseName }: CaseBreadcrumbProps) {
  return (
    <nav className="flex items-center text-base text-gray-600 mb-2 sm:mb-4">
      <Link href="/cases" className="hover:text-blue-600 transition-colors">
        Cases
      </Link>
      <span className="mx-2">›</span>
      <span className="text-gray-900 font-medium">{caseName}</span>
    </nav>
  )
}

