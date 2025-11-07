'use client'

import React from 'react'
import CaseBreadcrumb from './CaseBreadcrumb'
import IncludeCaseToggle from './IncludeCaseToggle'
import ScenarioAbout from './ScenarioAbout'

interface CasePageHeaderProps {
  caseName: string
  title: string
  isSelected: boolean
  onToggle: () => void
  aboutContent: React.ReactNode
  leftControls?: React.ReactNode // For controls that appear below "About" section (e.g., Applicable Code dropdown)
  rightControls?: React.ReactNode // For case-specific controls next to the Include toggle (e.g., Reset button)
}

/**
 * Reusable header section for case pages
 * Includes breadcrumb, title, about section, and include toggle
 * Optionally accepts additional controls on both left and right sides
 */
export default function CasePageHeader({ 
  caseName, 
  title, 
  isSelected, 
  onToggle, 
  aboutContent,
  leftControls,
  rightControls 
}: CasePageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-8">
      <CaseBreadcrumb caseName={caseName} />
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          
          <ScenarioAbout>
            {aboutContent}
          </ScenarioAbout>
          
          {/* Optional left-side controls (below About section) */}
          {leftControls && (
            <div className="mt-3">
              {leftControls}
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="sm:ml-6 space-y-2 sm:space-y-3 w-full sm:w-auto">
          <IncludeCaseToggle 
            isSelected={isSelected}
            onToggle={onToggle}
          />
          
          {/* Optional case-specific controls */}
          {rightControls}
        </div>
      </div>
    </div>
  )
}

