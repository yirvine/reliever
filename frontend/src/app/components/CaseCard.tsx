'use client'

import Link from 'next/link'
import { CaseId, CaseResult } from '../context/CaseContext'

interface CaseCardProps {
  caseId: CaseId
  title: string
  description: string
  href: string
  isSelected: boolean
  caseResult: CaseResult
  fluidName?: string
  hasStarted: boolean
  onToggle: () => void
}

/**
 * Reusable card component for displaying relief calculation cases
 * Used on the main cases page
 */
export default function CaseCard({
  caseId,
  title,
  description,
  href,
  isSelected,
  caseResult,
  fluidName,
  hasStarted,
  onToggle
}: CaseCardProps) {
  // Only show "Incomplete" if case is selected, has been started, but is not yet calculated
  // Don't show it for pristine cases (never touched) or completed cases
  const showIncomplete = isSelected && hasStarted && !caseResult.isCalculated

  return (
    <Link href={href} className="block">
      <div className={`
        p-3 border rounded-lg transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md' 
          : 'border-gray-200 bg-gray-50 opacity-60'
        }
      `}>
        <div className="flex items-center gap-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 accent-slate-600 rounded cursor-pointer"
          />
          
          {/* Card Content */}
          <div className="flex items-center justify-between flex-1">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className={`text-base font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                  {title}
                </h4>
                {isSelected && (
                  <>
                    {caseResult.isCalculated && caseResult.asmeVIIIDesignFlow ? (
                      <span className="text-sm font-medium text-blue-600">
                        {caseResult.asmeVIIIDesignFlow.toLocaleString()} lb/hr
                        {fluidName && ` ${fluidName}`}
                      </span>
                    ) : showIncomplete ? (
                      <span className="text-sm text-amber-600 font-medium">Incomplete</span>
                    ) : null}
                  </>
                )}
              </div>
              <p className={`text-sm mt-1 ${isSelected ? 'text-gray-600' : 'text-gray-400'}`}>
                {description}
              </p>
            </div>
            {isSelected && (
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

