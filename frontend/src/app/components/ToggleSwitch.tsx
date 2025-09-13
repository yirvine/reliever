'use client'

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  size?: 'sm' | 'md'
}

export default function ToggleSwitch({ enabled, onChange, size = 'md' }: ToggleSwitchProps) {
  const sizeClasses = size === 'sm' 
    ? 'h-5 w-9' 
    : 'h-6 w-11'
  
  const thumbClasses = size === 'sm'
    ? 'h-4 w-4'
    : 'h-5 w-5'

  return (
    <button
      type="button"
      className={`
        relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
        focus:ring-blue-500 focus:ring-offset-2 ${sizeClasses}
        ${enabled ? 'bg-green-600' : 'bg-gray-200'}
      `}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span className="sr-only">Toggle case selection</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 
          transition duration-200 ease-in-out ${thumbClasses}
          ${enabled ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'}
        `}
      />
    </button>
  )
}
