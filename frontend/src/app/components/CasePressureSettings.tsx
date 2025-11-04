'use client'

import { useEffect } from 'react'
import Tooltip from './Tooltip'

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
  mawpPercent?: number // MAWP percentage (121% for fire, 110% for non-fire)
  disabled?: boolean // Disable all form fields
}

export default function CasePressureSettings({ pressureData, onChange, caseName, isAutoCalculated = false, vesselMawp = 0, fireExposedArea, mawpPercent = 110, disabled = false }: CasePressureSettingsProps) {
  // Use provided percentage or default to 110% for non-fire cases
  const autoPercent = mawpPercent
  const hasValidMawp = vesselMawp && vesselMawp > 0
  const autoMavp = hasValidMawp ? vesselMawp * (autoPercent / 100) : 0 // MAVP = % of MAWP
  const autoBackpressure = hasValidMawp ? Math.abs(vesselMawp - autoMavp) : 0 // |MAWP - MAVP|

  // Auto-sync calculated values to parent component
  useEffect(() => {
    if (isAutoCalculated && vesselMawp > 0) {
      // Only update if values have changed to avoid infinite loops
      if (Math.abs(pressureData.maxAllowedVentingPressurePercent - autoPercent) > 0.01) {
        onChange('maxAllowedVentingPressurePercent', autoPercent)
      }
      if (Math.abs(pressureData.maxAllowedVentingPressure - autoMavp) > 0.01) {
        onChange('maxAllowedVentingPressure', autoMavp)
      }
      if (Math.abs(pressureData.maxAllowableBackpressure - autoBackpressure) > 0.01) {
        onChange('maxAllowableBackpressure', autoBackpressure)
      }
    }
  }, [isAutoCalculated, vesselMawp, autoPercent, autoMavp, autoBackpressure, pressureData, onChange])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Pressure Limits & Allowances
      </h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Max. Allowed Venting Pressure (%)
            </label>
            {isAutoCalculated && (
              <Tooltip 
                className="min-w-max"
                content={`ASME VIII requires ${autoPercent}% of MAWP for ${caseName.toLowerCase()} cases`}
              />
            )}
          </div>
          <input
            type="number"
            step="0.1"
            value={isAutoCalculated ? autoPercent : (pressureData.maxAllowedVentingPressurePercent || '')}
            onChange={(e) => onChange('maxAllowedVentingPressurePercent', parseFloat(e.target.value) || 0)}
            disabled={isAutoCalculated || disabled}
            className={`w-full h-10 px-3 py-2 border rounded-md ${
              isAutoCalculated 
                ? 'border-gray-200 bg-blue-50 text-gray-700 font-medium' 
                : disabled
                  ? 'border-gray-200 bg-gray-50 text-gray-500'
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
              <Tooltip 
                className="min-w-max"
                content={`${autoPercent}% of MAWP`}
              />
            )}
          </div>
          <input
            type={isAutoCalculated && !hasValidMawp ? 'text' : 'number'}
            step="0.1"
            value={isAutoCalculated ? (hasValidMawp ? autoMavp.toFixed(1) : '—') : (pressureData.maxAllowedVentingPressure || '')}
            onChange={(e) => onChange('maxAllowedVentingPressure', parseFloat(e.target.value) || 0)}
            disabled={isAutoCalculated || disabled}
            className={`w-full h-10 px-3 py-2 border rounded-md ${
              isAutoCalculated 
                ? 'border-gray-200 bg-blue-50 text-gray-700 font-medium' 
                : disabled
                  ? 'border-gray-200 bg-gray-50 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="e.g., 18.0"
            title={isAutoCalculated ? (hasValidMawp ? `Auto-calculated: ${autoPercent}% of MAWP` : 'Incomplete: Vessel Design MAWP required') : ''}
            required
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Max. Allowable Backpressure (psig)
            </label>
            {isAutoCalculated && (
              <Tooltip 
                className="min-w-max"
                content="Maximum allowable superimposed backpressure from downstream piping losses (MAWP - MAVP)"
              />
            )}
          </div>
          <input
            type={isAutoCalculated && !hasValidMawp ? 'text' : 'number'}
            step="0.1"
            value={isAutoCalculated ? (hasValidMawp ? autoBackpressure.toFixed(1) : '—') : (pressureData.maxAllowableBackpressure || '')}
            onChange={(e) => onChange('maxAllowableBackpressure', parseFloat(e.target.value) || 0)}
            disabled={isAutoCalculated || disabled}
            className={`w-full h-10 px-3 py-2 border rounded-md ${
              isAutoCalculated 
                ? 'border-gray-200 bg-blue-50 text-gray-700 font-medium' 
                : disabled
                  ? 'border-gray-200 bg-gray-50 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="e.g., 3.1"
            title={isAutoCalculated ? (hasValidMawp ? 'Auto-calculated: |MAWP - MAVP|' : 'Incomplete: Vessel Design MAWP required') : ''}
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
