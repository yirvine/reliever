'use client'

import { useState } from 'react'
import { getFluidNames, getFluidProperties, getStandardDiameters } from '../../../lib/database'

interface VesselData {
  vesselTag: string
  straightSideHeight: number
  vesselDiameter: number
  headType: string
  workingFluid: string
  vesselDesignMawp: number
  asmeSetPressure: number
}

interface VesselPropertiesProps {
  vesselData: VesselData
  onChange: (field: keyof VesselData, value: string | number) => void
  onFluidPropertiesFound?: (heatOfVaporization: number) => void // Callback for fluid properties
}

export default function VesselProperties({ vesselData, onChange, onFluidPropertiesFound }: VesselPropertiesProps) {
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
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Vessel Properties</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* First row: vessel tag, straight side height, vessel diameter, working fluid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vessel Tag
          </label>
          <input
            type="text"
            value={vesselData.vesselTag}
            onChange={(e) => onChange('vesselTag', e.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            placeholder="e.g., 123"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Straight Side Height (inches)
          </label>
          <input
            type="number"
            step="0.1"
            value={vesselData.straightSideHeight || ''}
            onChange={(e) => onChange('straightSideHeight', parseFloat(e.target.value) || 0)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            placeholder="e.g., 24.0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vessel Diameter (inches)
          </label>
          <select
            value={vesselData.vesselDiameter || ''}
            onChange={(e) => onChange('vesselDiameter', parseFloat(e.target.value) || 0)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working Fluid
          </label>
          <select
            value={vesselData.workingFluid}
            onChange={(e) => handleFluidChange(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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

        {/* Second row: construction code, head type, set pressure, MAWP */}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Head Type
          </label>
          <select
            value={vesselData.headType}
            onChange={(e) => onChange('headType', e.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="Hemispherical">Hemispherical</option>
            <option value="Elliptical">Elliptical</option>
            <option value="Flat">Flat</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ASME Set Pressure (psig)
          </label>
          <input
            type="number"
            step="0.1"
            value={vesselData.asmeSetPressure || ''}
            onChange={(e) => onChange('asmeSetPressure', parseFloat(e.target.value) || 0)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            placeholder="e.g., 14.9"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vessel Design MAWP (psig)
          </label>
          <input
            type="number"
            step="0.1"
            value={vesselData.vesselDesignMawp || ''}
            onChange={(e) => onChange('vesselDesignMawp', parseFloat(e.target.value) || 0)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            placeholder="e.g., 14.9"
            required
          />
        </div>
      </div>
    </div>
  )
}
