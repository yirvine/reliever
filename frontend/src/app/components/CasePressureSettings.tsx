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
}

export default function CasePressureSettings({ pressureData, onChange, caseName }: CasePressureSettingsProps) {
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
            Max. Allowed Venting Pressure (psig)
          </label>
          <input
            type="number"
            step="0.1"
            value={pressureData.maxAllowedVentingPressure || ''}
            onChange={(e) => onChange('maxAllowedVentingPressure', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            placeholder="e.g., 18.0"
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
            value={pressureData.maxAllowableBackpressure || ''}
            onChange={(e) => onChange('maxAllowableBackpressure', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            placeholder="e.g., 3.1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max. Allowed Venting Pressure (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={pressureData.maxAllowedVentingPressurePercent || ''}
            onChange={(e) => onChange('maxAllowedVentingPressurePercent', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            placeholder="e.g., 121"
            required
          />
          <p className="text-xs text-gray-500 mt-1">% of MAWP</p>
        </div>
      </div>
    </div>
  )
}
