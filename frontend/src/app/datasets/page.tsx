'use client'

import Link from 'next/link'
import Header from '../components/Header'
import PageTransition from '../components/PageTransition'
import { useScrollPosition } from '../hooks/useScrollPosition'

export default function ReferencePage() {
  useScrollPosition()

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mobile-pt-0">
          <div>
            <h1 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 font-inter">
              Datasets
            </h1>
            
            <p className="text-lg text-gray-600 mb-12 font-inter leading-relaxed">
              These tables contain internal values used by ReliefGuard for automated relief calculations. 
              The data is sourced from industry standards and engineering references, and is not user-editable 
              to ensure calculation accuracy and consistency.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Fluid Properties Card */}
              <Link 
                href="/datasets/fluids"
                className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors duration-200">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 font-inter">
                    Fluid Properties
                  </h2>
                </div>
                <p className="text-gray-600 font-inter">
                  Heat of vaporization, molecular weight, and liquid density values for common industrial fluids 
                  used in relief valve sizing calculations.
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors duration-200">
                  <span>View Fluid Properties</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Gas Properties Card */}
              <Link 
                href="/datasets/gas-properties"
                className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-100 transition-colors duration-200">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 font-inter">
                    Gas Properties
                  </h2>
                </div>
                <p className="text-gray-600 font-inter">
                  Molecular weight, specific gravity, and compressibility factors for common industrial gases 
                  used in control valve failure calculations per API-521.
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors duration-200">
                  <span>View Gas Properties</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Vessel Head Areas Card */}
              <Link 
                href="/datasets/vessel-head-areas"
                className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-100 transition-colors duration-200">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 font-inter">
                    Vessel Head Areas
                  </h2>
                </div>
                <p className="text-gray-600 font-inter">
                  Wetted surface area calculations for different vessel head types and diameters, 
                  used in fire exposure calculations per NFPA 30 and API 521.
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors duration-200">
                  <span>View Head Areas</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
