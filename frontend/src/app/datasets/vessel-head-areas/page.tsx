'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { getStandardDiameters, getVesselHeadArea } from '../../../../lib/database'

export default function VesselHeadAreasReferencePage() {
  useScrollPosition()
  
  const standardDiameters = getStandardDiameters()

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="max-w-6xl">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <Link 
                href="/datasets" 
                className="text-blue-600 hover:text-blue-800 font-inter flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Datasets
              </Link>
            </nav>

            <div className="mb-8">
              <h1 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-inter">
                Vessel Head Areas
              </h1>
              <p className="text-lg text-gray-600 font-inter leading-relaxed">
                Wetted surface area calculations for different vessel head types and diameters, 
                used in fire exposure calculations per NFPA 30 and API 521 standards.
              </p>
            </div>

            {/* Head Type Explanations */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-inter">Elliptical Heads</h3>
                <p className="text-gray-600 font-inter text-sm">
                  2:1 elliptical heads are the most common type used in pressure vessels. 
                  They provide good strength-to-weight ratio and are economical to manufacture.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-inter">Hemispherical Heads</h3>
                <p className="text-gray-600 font-inter text-sm">
                  Hemispherical heads provide the strongest design but are more expensive to manufacture. 
                  Often used in high-pressure applications.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-inter">Flat Heads</h3>
                <p className="text-gray-600 font-inter text-sm">
                  Flat heads are the simplest design but require significant thickness for high pressures. 
                  Used in low-pressure applications or where space is limited.
                </p>
              </div>
            </div>

            {/* Head Areas Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 font-inter">
                  Head Area Database
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Areas in square feet for standard vessel diameters
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                        Diameter (inches)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                        Elliptical (sq ft)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                        Hemispherical (sq ft)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                        Flat (sq ft)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {standardDiameters.map((diameter) => (
                      <tr key={diameter} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 font-inter">
                            {diameter}&quot;
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-inter">
                            {getVesselHeadArea(diameter, 'Elliptical')?.toFixed(3) || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-inter">
                            {getVesselHeadArea(diameter, 'Hemispherical')?.toFixed(3) || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-inter">
                            {getVesselHeadArea(diameter, 'Flat')?.toFixed(3) || '—'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Usage Note */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 font-inter">
                    Usage in ReliefGuard
                  </h3>
                  <div className="mt-2 text-sm text-green-700 font-inter">
                    <p>
                      These head areas are automatically used in fire exposure calculations when you specify 
                      vessel diameter and head type in the vessel properties section. The total wetted surface 
                      area (cylindrical + head areas) determines the heat input for external fire scenarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
