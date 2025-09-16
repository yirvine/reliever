'use client'

interface CasePressureData {
  maxAllowedVentingPressure: number
  maxAllowableBackpressure: number
  maxAllowedVentingPressurePercent: number
}

interface CasePressureSettingsProps {
  pressureData: CasePressureData
  onChange: (field: keyof CasePressureData, value: number) => void
  caseName: string
  isAutoCalculated?: boolean // For cases like External Fire where values are fixed
  vesselMawp?: number // For auto-calculation
  fireExposedArea?: number // Auto-calculated field for External Fire
}

export default function CasePressureSettings({ pressureData, onChange, caseName, isAutoCalculated = false, vesselMawp = 0, fireExposedArea }: CasePressureSettingsProps) {
  // Auto-calculate values for External Fire case
  const autoPercent = 121 // Fixed 121% for External Fire
  const autoMavp = vesselMawp * (autoPercent / 100) // MAVP = 121% of MAWP
  const autoBackpressure = Math.abs(vesselMawp - autoMavp) // |MAWP - MAVP|
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {caseName} - Case-Specific Settings
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Case-specific pressure limits and allowances
      </p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Max. Allowed Venting Pressure (%)
            </label>
            {isAutoCalculated && (
              <div className="group relative">
                <svg 
                  className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-max select-text pointer-events-none">
                  Always 121% for External Fire case
                </div>
              </div>
            )}
          </div>
          <input
            type="number"
            step="0.1"
            value={isAutoCalculated ? autoPercent : (pressureData.maxAllowedVentingPressurePercent || '')}
            onChange={(e) => onChange('maxAllowedVentingPressurePercent', parseFloat(e.target.value) || 0)}
            disabled={isAutoCalculated}
            className={`w-full h-10 px-3 py-2 border rounded-md ${
              isAutoCalculated 
                ? 'border-gray-200 bg-blue-50 text-gray-700 font-medium' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="e.g., 121"
            required
          />
          <p className="text-xs text-gray-500 mt-1">% of MAWP {isAutoCalculated ? '(fixed for External Fire)' : ''}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Max. Allowed Venting Pressure (psig)
            </label>
            {isAutoCalculated && (
              <div className="group relative">
                <svg 
                  className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-max select-text pointer-events-none">
                  121% of MAWP
                </div>
              </div>
            )}
          </div>
          <input
            type="number"
            step="0.1"
            value={isAutoCalculated ? autoMavp.toFixed(1) : (pressureData.maxAllowedVentingPressure || '')}
            onChange={(e) => onChange('maxAllowedVentingPressure', parseFloat(e.target.value) || 0)}
            disabled={isAutoCalculated}
            className={`w-full h-10 px-3 py-2 border rounded-md ${
              isAutoCalculated 
                ? 'border-gray-200 bg-blue-50 text-gray-700 font-medium' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="e.g., 18.0"
            title={isAutoCalculated ? 'Auto-calculated: 121% of MAWP' : ''}
            required
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Max. Allowable Backpressure (psig)
            </label>
            {isAutoCalculated && (
              <div className="group relative">
                <svg 
                  className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-max select-text pointer-events-none">
                  Maximum allowable superimposed backpressure from downstream piping losses (MAWP - MAVP)
                </div>
              </div>
            )}
          </div>
          <input
            type="number"
            step="0.1"
            value={isAutoCalculated ? autoBackpressure.toFixed(1) : (pressureData.maxAllowableBackpressure || '')}
            onChange={(e) => onChange('maxAllowableBackpressure', parseFloat(e.target.value) || 0)}
            disabled={isAutoCalculated}
            className={`w-full h-10 px-3 py-2 border rounded-md ${
              isAutoCalculated 
                ? 'border-gray-200 bg-blue-50 text-gray-700 font-medium' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="e.g., 3.1"
            title={isAutoCalculated ? 'Auto-calculated: |MAWP - MAVP|' : ''}
            required
          />
        </div>

        {/* Total Fire Exposed Area - only for External Fire */}
        {fireExposedArea !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Fire Exposed Area (sq. ft)
            </label>
            <input
              type="text"
              value={fireExposedArea.toFixed(2)}
              disabled
              className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-gray-700 font-medium"
              title="Auto-calculated based on vessel dimensions and fire code"
            />
          </div>
        )}
      </div>
    </div>
  )
}
