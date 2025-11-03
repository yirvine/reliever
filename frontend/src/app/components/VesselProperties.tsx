'use client'

import { useState } from 'react'
import { getFluidNames, getFluidProperties, getStandardDiameters, VesselOrientation } from '../../../lib/database'
import Tooltip from './Tooltip'

interface VesselData {
  vesselTag: string
  straightSideHeight: number
  vesselDiameter: number
  headType: string
  workingFluid: string
  vesselDesignMawp: number
  asmeSetPressure: number
  
  // API 521 enhancements
  vesselOrientation?: VesselOrientation
  headProtectedBySkirt?: boolean
  fireSourceElevation?: number
}

interface VesselPropertiesProps {
  vesselData: VesselData
  onChange: (field: keyof VesselData, value: string | number | boolean) => void
  onFluidPropertiesFound?: (heatOfVaporization: number) => void // Callback for fluid properties
  hideWorkingFluid?: boolean // Hide working fluid field for nitrogen case
  disabled?: boolean // Disable all form fields
  applicableFireCode?: string // Fire code selection to conditionally show fields
  hideHeading?: boolean // Hide the "Vessel Properties" heading
}

export default function VesselProperties({ vesselData, onChange, onFluidPropertiesFound, hideWorkingFluid = false, disabled = false, applicableFireCode, hideHeading = false }: VesselPropertiesProps) {
  const [fluidNames] = useState(() => getFluidNames())
  const [standardDiameters] = useState(() => getStandardDiameters())

  const handleFluidChange = (fluidName: string) => {
    onChange('workingFluid', fluidName)
    
    // Get fluid properties and pass heat of vaporization to parent
    const properties = getFluidProperties(fluidName)
    if (properties && onFluidPropertiesFound) {
      onFluidPropertiesFound(properties.heat_of_vaporization)
    }
  }
  
  // Determine which advanced fields to show based on fire code
  const showAdvancedAPI521Fields = applicableFireCode === 'API 521'
  
  // Check if sphere is selected - hide irrelevant fields
  const isSphere = vesselData.vesselOrientation === 'sphere'
  
  return (
    <div className={hideHeading ? "" : "bg-white rounded-lg shadow-sm border border-gray-200 p-6"}>
      {!hideHeading && <h2 className="text-xl font-bold text-gray-900 mb-6">Vessel Properties</h2>}
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* First row: vessel tag, vessel orientation, vessel diameter, working fluid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vessel Tag
          </label>
          <input
            type="text"
            value={vesselData.vesselTag}
            onChange={(e) => onChange('vesselTag', e.target.value)}
            disabled={disabled}
            className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
              disabled 
                ? 'border-gray-200 bg-gray-50 text-gray-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="e.g., 123"
            required
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Vessel Orientation
            </label>
            <Tooltip
              className="w-80"
              content={
                <>
                  <div className="mb-2">
                    <strong className="text-blue-300">Required for Both Codes:</strong>
                  </div>
                  <div className="mb-1"><strong>Vertical:</strong> Standard vertical pressure vessel</div>
                  <div className="mb-1"><strong>Horizontal:</strong> Horizontal drum or tank</div>
                  <div className="mb-2">
                    <strong>Sphere:</strong> Spherical vessel<br/>
                    • NFPA 30 §22.7.3.2.3: Uses 55% of total exposed area<br/>
                    • API 521 Table 4: Uses entire bottom hemisphere minimum
                  </div>
                  <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                    Affects wetted surface area calculation for fire exposure.
                  </div>
                </>
              }
            />
          </div>
          <select
            value={vesselData.vesselOrientation || 'vertical'}
            onChange={(e) => onChange('vesselOrientation', e.target.value)}
            disabled={disabled}
            className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
              disabled 
                ? 'border-gray-200 bg-gray-50 text-gray-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
            <option value="sphere">Sphere</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vessel Diameter (inches)
          </label>
          <select
            value={vesselData.vesselDiameter || ''}
            onChange={(e) => onChange('vesselDiameter', parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
              disabled 
                ? 'border-gray-200 bg-gray-50 text-gray-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            required
          >
            <option value="">Select diameter...</option>
            {standardDiameters.map((diameter) => (
              <option key={diameter} value={diameter}>
                {diameter}&quot; OD
              </option>
            ))}
          </select>
        </div>

        {!hideWorkingFluid && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Working Fluid
            </label>
            <select
              value={vesselData.workingFluid}
              onChange={(e) => handleFluidChange(e.target.value)}
              disabled={disabled}
              className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                disabled 
                  ? 'border-gray-200 bg-gray-50 text-gray-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            >
              <option value="">Select fluid...</option>
              {fluidNames.map((fluid) => (
                <option key={fluid} value={fluid}>
                  {fluid}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Second row: construction code, head type (if not sphere), straight side height (if not sphere), set pressure, MAWP */}
        {!isSphere && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Straight Side Height (inches)
            </label>
            <input
              type="number"
              step="0.1"
              value={vesselData.straightSideHeight || ''}
              onChange={(e) => onChange('straightSideHeight', parseFloat(e.target.value) || 0)}
              disabled={disabled}
              className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
                disabled 
                  ? 'border-gray-200 bg-gray-50 text-gray-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="e.g., 24.0"
              required
            />
          </div>
        )}

        {/* Second row: construction code, head type (not for sphere), set pressure, MAWP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vessel Construction Code
          </label>
          <input
            type="text"
            value="ASME VIII"
            disabled
            className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-blue-50 text-gray-700 font-medium"
          />
        </div>

        {!isSphere && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Head Type
            </label>
            <select
              value={vesselData.headType}
              onChange={(e) => onChange('headType', e.target.value)}
              disabled={disabled}
              className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 ${
                disabled 
                  ? 'border-gray-200 bg-gray-50 text-gray-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="Hemispherical">Hemispherical</option>
              <option value="Elliptical">Elliptical</option>
              <option value="Flat">Flat</option>
            </select>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Vessel Design MAWP (psig)
            </label>
            <Tooltip
              className="w-80"
              content={
                <>
                  <div className="mb-2">
                    <strong className="text-blue-300">Maximum Allowable Working Pressure:</strong>
                  </div>
                  <div className="mb-2">
                    The maximum gauge pressure permissible at the top of the vessel in its operating position at the designated coincident temperature specified for that pressure.
                  </div>
                  <div className="text-xs border-t border-gray-600 pt-2 mt-2">
                    Per ASME Section VIII Div. 1: Relief device set pressure must not exceed MAWP.
                  </div>
                </>
              }
            />
          </div>
          <input
            type="number"
            step="0.1"
            value={vesselData.vesselDesignMawp || ''}
            onChange={(e) => onChange('vesselDesignMawp', parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
              disabled 
                ? 'border-gray-200 bg-gray-50 text-gray-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="e.g., 15"
            required
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              ASME Set Pressure (psig)
            </label>
            <Tooltip
              className="w-80"
              content={
                <>
                  <div className="mb-2">
                    <strong className="text-blue-300">Relief Device Set Pressure:</strong>
                  </div>
                  <div className="mb-2">
                    The inlet gauge pressure at which the pressure relief device is set to open.
                  </div>
                  <div className="text-xs border-t border-gray-600 pt-2 mt-2 text-yellow-200">
                    <strong>⚠️ ASME Requirement:</strong> Set pressure must not exceed vessel MAWP (typically set at or slightly below MAWP).
                  </div>
                </>
              }
            />
          </div>
          <input
            type="number"
            step="0.1"
            value={vesselData.asmeSetPressure || ''}
            onChange={(e) => onChange('asmeSetPressure', parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className={`w-full h-10 px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 ${
              disabled 
                ? 'border-gray-200 bg-gray-50 text-gray-500' 
                : vesselData.asmeSetPressure > vesselData.vesselDesignMawp
                  ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="e.g., 14.9"
            required
          />
          {vesselData.asmeSetPressure > vesselData.vesselDesignMawp && vesselData.vesselDesignMawp > 0 && (
            <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
              <span>⚠️</span>
              <span>Set pressure exceeds MAWP - not compliant with ASME Section VIII</span>
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
