'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { getFluidNames, getFluidProperties } from '../../../../lib/database'

export default function FluidsReferencePage() {
  useScrollPosition()
  
  const fluidNames = getFluidNames()
  const fluidProperties = fluidNames.map(name => getFluidProperties(name)).filter(Boolean)

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
                Fluid Properties
              </h1>
              <p className="text-lg text-gray-600 font-inter leading-relaxed">
                Heat of vaporization, molecular weight, and liquid density values for common industrial fluids 
                used in relief valve sizing calculations. Values are sourced from industry standards and engineering references.
              </p>
            </div>

            {/* Fluid Properties Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 font-inter">
                  Fluid Properties Database
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {fluidProperties.length} fluids available
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                        Fluid Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                        Heat of Vaporization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                        Molecular Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                        Liquid Density
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fluidProperties.map((fluid, index) => (
                      <tr key={fluid?.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 font-inter">
                            {fluid?.fluid_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-inter">
                            {fluid?.heat_of_vaporization ? `${fluid.heat_of_vaporization} Btu/lb` : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-inter">
                            {fluid?.molecular_weight ? `${fluid.molecular_weight} lb/lbmol` : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-inter">
                            {fluid?.liquid_density ? `${fluid.liquid_density} lb/ft³` : '—'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Usage Note */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 font-inter">
                    Usage in ReliefGuard
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 font-inter">
                    <p>
                      These fluid properties are automatically used in relief calculations when you select a working fluid 
                      in the vessel properties section. The heat of vaporization is particularly important for external fire 
                      calculations, where it determines the relieving flow rate.
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
