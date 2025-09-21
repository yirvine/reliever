'use client'

import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'

// Vessel head area data from schema.sql
const vesselHeadAreas = [
  // Elliptical heads
  { diameter: 30, headType: 'Elliptical', area: 0.1524 },
  { diameter: 36, headType: 'Elliptical', area: 0.233 },
  { diameter: 42, headType: 'Elliptical', area: 0.33 },
  { diameter: 48, headType: 'Elliptical', area: 0.56 },
  { diameter: 54, headType: 'Elliptical', area: 0.87 },
  { diameter: 60, headType: 'Elliptical', area: 1.22 },
  { diameter: 66, headType: 'Elliptical', area: 1.46 },
  { diameter: 72, headType: 'Elliptical', area: 1.91 },
  { diameter: 78, headType: 'Elliptical', area: 2.42 },
  { diameter: 84, headType: 'Elliptical', area: 2.99 },
  { diameter: 90, headType: 'Elliptical', area: 3.61 },
  { diameter: 96, headType: 'Elliptical', area: 4.30 },
  { diameter: 102, headType: 'Elliptical', area: 6.72 },
  { diameter: 108, headType: 'Elliptical', area: 17.21 },
  { diameter: 114, headType: 'Elliptical', area: 21.79 },
  { diameter: 120, headType: 'Elliptical', area: 26.88 },
  { diameter: 126, headType: 'Elliptical', area: 32.53 },
  { diameter: 132, headType: 'Elliptical', area: 38.75 },
  { diameter: 138, headType: 'Elliptical', area: 45.43 },
  { diameter: 144, headType: 'Elliptical', area: 52.70 },
  { diameter: 150, headType: 'Elliptical', area: 60.49 },
  { diameter: 156, headType: 'Elliptical', area: 70.25 },
  { diameter: 162, headType: 'Elliptical', area: 77.69 },
  { diameter: 168, headType: 'Elliptical', area: 87.15 },

  // Hemispherical heads
  { diameter: 30, headType: 'Hemispherical', area: 0.13 },
  { diameter: 36, headType: 'Hemispherical', area: 0.20 },
  { diameter: 42, headType: 'Hemispherical', area: 0.28 },
  { diameter: 48, headType: 'Hemispherical', area: 0.48 },
  { diameter: 54, headType: 'Hemispherical', area: 0.75 },
  { diameter: 60, headType: 'Hemispherical', area: 1.05 },
  { diameter: 66, headType: 'Hemispherical', area: 1.32 },
  { diameter: 72, headType: 'Hemispherical', area: 1.65 },
  { diameter: 78, headType: 'Hemispherical', area: 2.09 },
  { diameter: 84, headType: 'Hemispherical', area: 2.59 },
  { diameter: 90, headType: 'Hemispherical', area: 3.13 },
  { diameter: 96, headType: 'Hemispherical', area: 3.72 },
  { diameter: 102, headType: 'Hemispherical', area: 5.82 },
  { diameter: 108, headType: 'Hemispherical', area: 14.89 },
  { diameter: 114, headType: 'Hemispherical', area: 18.84 },
  { diameter: 120, headType: 'Hemispherical', area: 23.04 },
  { diameter: 126, headType: 'Hemispherical', area: 28.15 },
  { diameter: 132, headType: 'Hemispherical', area: 33.50 },
  { diameter: 138, headType: 'Hemispherical', area: 39.32 },
  { diameter: 144, headType: 'Hemispherical', area: 45.60 },
  { diameter: 150, headType: 'Hemispherical', area: 52.35 },
  { diameter: 156, headType: 'Hemispherical', area: 59.56 },
  { diameter: 162, headType: 'Hemispherical', area: 67.23 },
  { diameter: 168, headType: 'Hemispherical', area: 75.38 },

  // Flat heads
  { diameter: 30, headType: 'Flat', area: 0.22 },
  { diameter: 36, headType: 'Flat', area: 0.34 },
  { diameter: 42, headType: 'Flat', area: 0.48 },
  { diameter: 48, headType: 'Flat', area: 0.815 },
  { diameter: 54, headType: 'Flat', area: 1.26 },
  { diameter: 60, headType: 'Flat', area: 1.77 },
  { diameter: 66, headType: 'Flat', area: 2.14 },
  { diameter: 72, headType: 'Flat', area: 2.79 },
  { diameter: 78, headType: 'Flat', area: 3.53 },
  { diameter: 84, headType: 'Flat', area: 4.36 },
  { diameter: 90, headType: 'Flat', area: 5.28 },
  { diameter: 96, headType: 'Flat', area: 6.28 },
  { diameter: 102, headType: 'Flat', area: 9.82 },
  { diameter: 108, headType: 'Flat', area: 25.13 },
  { diameter: 114, headType: 'Flat', area: 31.81 },
  { diameter: 120, headType: 'Flat', area: 39.27 },
  { diameter: 126, headType: 'Flat', area: 47.52 },
  { diameter: 132, headType: 'Flat', area: 56.55 },
  { diameter: 138, headType: 'Flat', area: 66.37 },
  { diameter: 144, headType: 'Flat', area: 76.97 },
  { diameter: 150, headType: 'Flat', area: 88.36 },
  { diameter: 156, headType: 'Flat', area: 100.53 },
  { diameter: 162, headType: 'Flat', area: 113.49 },
  { diameter: 168, headType: 'Flat', area: 127.24 }
]

// Group data by head type for better organization
const groupedData = vesselHeadAreas.reduce((acc, item) => {
  if (!acc[item.headType]) {
    acc[item.headType] = []
  }
  acc[item.headType].push(item)
  return acc
}, {} as Record<string, typeof vesselHeadAreas>)

export default function VesselHeadAreasPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header showBreadcrumb={true} breadcrumbText="Vessel Head Area Table" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vessel Head Area Table</h1>
            <p className="text-gray-600">
              Reference data for vessel head surface areas used in fire exposure calculations.
            </p>
          </div>

          {Object.entries(groupedData).map(([headType, areas]) => (
            <div key={headType} className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {headType} Heads
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {areas.length} diameter options available
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Diameter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Head Area
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {areas.map((item, index) => (
                        <tr key={`${item.diameter}-${item.headType}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.diameter}"
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.area} sq ft
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Usage Notes</h3>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Elliptical (2:1):</strong> Most common head type for pressure vessels</p>
              <p><strong>Hemispherical (ASME F&D):</strong> Used for high-pressure applications</p>
              <p><strong>Flat:</strong> Used for low-pressure applications or when space is limited</p>
              <p><strong>Fire Exposure:</strong> Head area is included in total wetted surface area calculations for external fire scenarios</p>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
