'use client'

interface TooltipProps {
  content: React.ReactNode
  className?: string
}

export default function Tooltip({ content, className = '' }: TooltipProps) {
  return (
    <div className="group/tooltip relative inline-block">
      <svg 
        className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <circle cx="12" cy="17" r="0.5" fill="currentColor"></circle>
      </svg>
      <div 
        className={`
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0
          px-4 py-3 bg-gray-900 text-white text-xs rounded-lg 
          opacity-0 pointer-events-none
          group-hover/tooltip:opacity-100 group-hover/tooltip:pointer-events-auto
          hover:opacity-100 hover:pointer-events-auto
          transition-opacity z-10 select-text cursor-auto
          ${className}
        `}
      >
        {content}
      </div>
    </div>
  )
}

