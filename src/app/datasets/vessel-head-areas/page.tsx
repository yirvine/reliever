'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useCase } from '../../context/CaseContext'
import { getStandardDiameters, getVesselHeadArea } from '@/lib/database'

export default function VesselHeadAreasReferencePage() {
  useScrollPosition()
  const { getDesignBasisFlow } = useCase()
  const designBasisFlow = getDesignBasisFlow()
  
  const standardDiameters = getStandardDiameters()

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />
        {/* Sticky Design Basis Flow Banner */}
        <div 
          className={`hidden sm:block fixed sm:sticky top-[3.5rem] sm:top-[5.5rem] z-40 bg-gradient-to-r from-slate-600 to-slate-700 border-b-2 border-slate-800 shadow-lg overflow-hidden transition-all duration-500 ease-in-out w-full ${
            designBasisFlow 
              ? 'sm:max-h-20 opacity-100' 
              : 'max-h-0 opacity-0 border-b-0 pointer-events-none'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 transition-opacity duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <svg className="w-5 h-5 text-slate-100 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-slate-100 font-inter uppercase tracking-wide">Current Design Basis Flow:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl sm:text-3xl font-bold text-white font-inter">{designBasisFlow?.flow.toLocaleString() || '0'}</span>
                <span className="text-sm sm:text-lg text-white font-medium">lb/hr</span>
                <span className="text-xs sm:text-sm text-slate-100">from {designBasisFlow?.caseName || ''}</span>
                <div className="relative group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200 cursor-help" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                  </svg>
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                    Maximum flow across all calculated cases for hydraulic network modeling
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 mobile-pt-0">
          <div className="mb-4 sm:mb-8">
            {/* Breadcrumb Navigation */}
            <div className="mb-2 sm:mb-4">
              <nav className="flex items-center text-base text-gray-600">
                <Link href="/datasets" className="hover:text-blue-600 transition-colors">
                  Datasets
                </Link>
                <span className="mx-2">›</span>
                <span className="text-gray-900 font-medium">Vessel Head Areas</span>
              </nav>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 font-inter">
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
