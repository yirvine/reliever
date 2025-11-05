'use client'

interface IncludeCaseToggleProps {
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
}

/**
 * Reusable toggle switch for including/excluding a case from calculations
 * Used in the header section of all case pages
 */
export default function IncludeCaseToggle({ isSelected, onToggle, disabled = false }: IncludeCaseToggleProps) {
  return (
    <div className="flex items-center justify-start sm:justify-end space-x-2">
      <span className="text-sm font-medium text-gray-700">Include Case</span>
      <div 
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent 
          transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
          ${isSelected ? 'bg-green-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={disabled ? undefined : onToggle}
        role="switch"
        aria-checked={isSelected}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        <span 
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition-all duration-500 ease-in-out
            ${isSelected ? 'translate-x-5' : 'translate-x-0'}
          `} 
        />
      </div>
    </div>
  )
}

