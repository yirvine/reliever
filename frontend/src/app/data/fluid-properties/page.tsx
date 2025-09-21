'use client'

import Header from '../../components/Header'
import PageTransition from '../../components/PageTransition'

// Fluid properties data from schema.sql
const fluidProperties = [
  { name: 'Acetaldehyde', heatOfVaporization: 252, molecularWeight: 44.05, liquidDensity: 1673 },
  { name: 'Acetic acid', heatOfVaporization: 174, molecularWeight: 60.05, liquidDensity: 1348 },
  { name: 'Acetone', heatOfVaporization: 224, molecularWeight: 58.08, liquidDensity: 1707 },
  { name: 'Air', heatOfVaporization: 0, molecularWeight: 28.97, liquidDensity: 0 },
  { name: 'Benzene', heatOfVaporization: 169, molecularWeight: 78.11, liquidDensity: 1494 },
  { name: 'Cyclohexane', heatOfVaporization: 154, molecularWeight: 84.16, liquidDensity: 1413 },
  { name: 'Dimethylamine', heatOfVaporization: 250, molecularWeight: 45.08, liquidDensity: 1679 },
  { name: 'Ethanol', heatOfVaporization: 368, molecularWeight: 46.07, liquidDensity: 2498 },
  { name: 'Ethyl acetate', heatOfVaporization: 157, molecularWeight: 88.11, liquidDensity: 1474 },
  { name: 'Gasoline', heatOfVaporization: 145, molecularWeight: 96, liquidDensity: 1421 },
  { name: 'Heptane', heatOfVaporization: 137, molecularWeight: 100.2, liquidDensity: 1371 },
  { name: 'Hexane', heatOfVaporization: 144, molecularWeight: 86.17, liquidDensity: 1357 },
  { name: 'Methanol', heatOfVaporization: 474, molecularWeight: 32.04, liquidDensity: 2663 },
  { name: 'Methylene Chloride', heatOfVaporization: 122, molecularWeight: 84.93, liquidDensity: 1124 },
  { name: 'Nitrogen', heatOfVaporization: 86, molecularWeight: 28, liquidDensity: 455 },
  { name: 'Octane', heatOfVaporization: 132, molecularWeight: 114.22, liquidDensity: 1411 },
  { name: 'Pentane', heatOfVaporization: 153, molecularWeight: 72.15, liquidDensity: 1300 },
  { name: 'Toluene', heatOfVaporization: 156, molecularWeight: 92.13, liquidDensity: 1497 },
  { name: 'Vinyl acetate', heatOfVaporization: 165, molecularWeight: 86.09, liquidDensity: 1532 },
  { name: 'Water', heatOfVaporization: 970, molecularWeight: 18.01, liquidDensity: 4111 }
]

export default function FluidPropertiesPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header showBreadcrumb={true} breadcrumbText="Fluid Properties" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fluid Properties</h1>
            <p className="text-gray-600">
              Reference data for heat of vaporization, molecular weight, and liquid density used in relief valve calculations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Fluid Properties Database</h2>
              <p className="text-sm text-gray-600 mt-1">
                {fluidProperties.length} fluids available for selection in vessel calculations
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fluid Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heat of Vaporization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Molecular Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liquid Density
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fluidProperties.map((fluid, index) => (
                    <tr key={fluid.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fluid.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {fluid.heatOfVaporization.toLocaleString()} Btu/lb
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {fluid.molecularWeight}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {fluid.liquidDensity.toLocaleString()} lb/ft³
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p><strong>Heat of Vaporization:</strong> Energy required to vaporize one pound of liquid at its boiling point</p>
                <p><strong>Molecular Weight:</strong> Mass of one mole of the substance (g/mol)</p>
                <p><strong>Liquid Density:</strong> Mass per unit volume of the liquid phase (lb/ft³)</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
