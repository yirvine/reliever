'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'
import { useCase } from '../../context/CaseContext'

// Gas properties data for control valve failure calculations
// Data sourced from NIST Chemistry WebBook and Perry's Chemical Engineers' Handbook (8th Ed)
const gasProperties = [
  { 
    name: 'Nitrogen (N₂)', 
    molecularWeight: 28.0134, 
    specificGravity: 0.967, 
    defaultZ: 1.0,
    source: 'NIST: Diatomic nitrogen at STP'
  },
  { 
    name: 'Air', 
    molecularWeight: 28.97, 
    specificGravity: 1.0, 
    defaultZ: 1.0,
    source: 'Standard dry air composition'
  },
  { 
    name: 'Oxygen (O₂)', 
    molecularWeight: 32.0, 
    specificGravity: 1.105, 
    defaultZ: 1.0,
    source: 'NIST: Diatomic oxygen at STP'
  },
  { 
    name: 'Carbon Dioxide (CO₂)', 
    molecularWeight: 44.01, 
    specificGravity: 1.52, 
    defaultZ: 0.99,
    source: 'NIST: CO₂ at STP'
  },
  { 
    name: 'Methane (CH₄)', 
    molecularWeight: 16.04, 
    specificGravity: 0.554, 
    defaultZ: 0.998,
    source: 'NIST: CH₄ at STP'
  },
  { 
    name: 'Hydrogen (H₂)', 
    molecularWeight: 2.016, 
    specificGravity: 0.0696, 
    defaultZ: 1.0,
    source: 'NIST: Diatomic hydrogen at STP'
  },
  { 
    name: 'Argon (Ar)', 
    molecularWeight: 39.948, 
    specificGravity: 1.379, 
    defaultZ: 1.0,
    source: 'NIST: Argon at STP'
  },
  { 
    name: 'Helium (He)', 
    molecularWeight: 4.003, 
    specificGravity: 0.138, 
    defaultZ: 1.0,
    source: 'NIST: Helium at STP'
  },
  { 
    name: 'Propane (C₃H₈)', 
    molecularWeight: 44.097, 
    specificGravity: 1.522, 
    defaultZ: 0.98,
    source: 'Perry\'s Handbook: Propane at standard conditions'
  },
  { 
    name: 'Butane (C₄H₁₀)', 
    molecularWeight: 58.12, 
    specificGravity: 2.006, 
    defaultZ: 0.97,
    source: 'Perry\'s Handbook: N-butane at standard conditions'
  },
  { 
    name: 'Ethane (C₂H₆)', 
    molecularWeight: 30.07, 
    specificGravity: 1.038, 
    defaultZ: 0.995,
    source: 'NIST: Ethane at STP'
  },
  { 
    name: 'Ammonia (NH₃)', 
    molecularWeight: 17.031, 
    specificGravity: 0.588, 
    defaultZ: 0.99,
    source: 'NIST: Ammonia at STP'
  },
  { 
    name: 'Chlorine (Cl₂)', 
    molecularWeight: 70.906, 
    specificGravity: 2.447, 
    defaultZ: 0.995,
    source: 'Perry\'s Handbook: Chlorine gas'
  },
  { 
    name: 'Sulfur Dioxide (SO₂)', 
    molecularWeight: 64.066, 
    specificGravity: 2.211, 
    defaultZ: 0.99,
    source: 'NIST: SO₂ at STP'
  }
]

export default function GasPropertiesPage() {
  const { getDesignBasisFlow } = useCase()
  const designBasisFlow = getDesignBasisFlow()

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
                <span className="text-gray-900 font-medium">Gas Properties</span>
              </nav>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gas Properties</h1>
              <p className="text-gray-600">
                Reference data for molecular weight, specific gravity, and compressibility factor used in control valve failure calculations (API-521 Section 4.4.8).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Gas Properties Database</h2>
              <p className="text-sm text-gray-600 mt-1">
                {gasProperties.length} gases available for control valve failure calculations
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gas Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Molecular Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specific Gravity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compressibility (Z)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gasProperties.map((gas, index) => (
                    <tr key={gas.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {gas.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {gas.molecularWeight.toFixed(4)} lb/lbmol
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {gas.specificGravity.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {gas.defaultZ.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {gas.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Molecular Weight (MW):</strong> Mass of one mole of gas (lb/lbmol) - used in ISA-S75.01 flow equations</p>
                <p><strong>Specific Gravity (SG):</strong> Ratio of gas density to air density at same conditions (dimensionless, relative to air = 1.0)</p>
                <p><strong>Compressibility Factor (Z):</strong> Deviation from ideal gas behavior (Z = 1.0 for ideal gas)</p>
                <p className="mt-2 pt-2 border-t border-gray-300"><strong>Note:</strong> These values are at standard temperature and pressure (STP). For process conditions significantly different from STP, compressibility factor (Z) should be calculated using equations of state or process simulation software.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Data Sources & Standards</h3>
            <div className="text-xs text-blue-800 space-y-2">
              <p>
                <strong>NIST Chemistry WebBook:</strong> Primary source for pure component molecular weights and thermophysical properties (https://webbook.nist.gov)
              </p>
              <p>
                <strong>Perry&apos;s Chemical Engineers&apos; Handbook (8th Edition):</strong> Reference for hydrocarbon and specialty gas properties
              </p>
              <p>
                <strong>API-520 Part I (10th Edition):</strong> Gas flow sizing methodology using ISA-S75.01 formulas, which require MW, SG, and Z
              </p>
              <p>
                <strong>API-521 Section 4.4.8:</strong> Control valve failure scenarios requiring gas property data for relief rate calculations
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Applicability & Limitations</h3>
            <div className="text-xs text-amber-800 space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Pure Component Gases:</strong> Values are for pure gases, not mixtures</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Standard Conditions:</strong> Properties are at or near STP (14.7 psia, 60-70°F)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">⚠</span>
                <span><strong>High Pressure:</strong> For pressures above 500 psig, verify Z factor using equations of state (Peng-Robinson, SRK)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">⚠</span>
                <span><strong>Gas Mixtures:</strong> For mixtures, calculate effective MW and SG using mole-weighted averages</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span><strong>Not for Liquid Service:</strong> These properties are for gaseous phase only. Liquid control valve failures require different analysis</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}

