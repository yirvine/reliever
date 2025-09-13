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
}

export default function CasePressureSettings({ pressureData, onChange, caseName, isAutoCalculated = false, vesselMawp = 0 }: CasePressureSettingsProps) {
  // Auto-calculate values for External Fire case
  const autoPercent = 121 // Fixed 121% for External Fire
  const autoMavp = vesselMawp * (autoPercent / 100) // MAVP = 121% of MAWP
  const autoBackpressure = Math.abs(vesselMawp - autoMavp) // |MAWP - MAVP|
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {caseName} - Pressure Settings
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Case-specific pressure limits and allowances
      </p>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max. Allowed Venting Pressure (%)
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max. Allowed Venting Pressure (psig)
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max. Allowable Backpressure (psig)
          </label>
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
      </div>
    </div>
  )
}
