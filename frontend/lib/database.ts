// Database utility functions for reference data lookups
// Simple interface for SQLite database queries

export interface FluidProperty {
  id: number
  fluid_name: string
  heat_of_vaporization: number // Btu/lb
  molecular_weight?: number // M
  liquid_density?: number // Lx (lb/ft³)
}

export interface VesselHeadArea {
  id: number
  diameter_inches: number
  head_type: 'Elliptical' | 'Hemispherical' | 'Flat'
  area_sq_feet: number
}

// For now, we'll use static data that matches the database
// Later this can be replaced with actual database calls via API

const FLUID_PROPERTIES: FluidProperty[] = [
  { id: 1, fluid_name: 'Acetaldehyde', heat_of_vaporization: 252, molecular_weight: 44.05, liquid_density: 1673 },
  { id: 2, fluid_name: 'Acetic acid', heat_of_vaporization: 174, molecular_weight: 60.05, liquid_density: 1348 },
  { id: 3, fluid_name: 'Acetone', heat_of_vaporization: 224, molecular_weight: 58.08, liquid_density: 1707 },
  { id: 4, fluid_name: 'Air', heat_of_vaporization: 0, molecular_weight: 28.97, liquid_density: 0 },
  { id: 5, fluid_name: 'Benzene', heat_of_vaporization: 169, molecular_weight: 78.11, liquid_density: 1494 },
  { id: 6, fluid_name: 'Cyclohexane', heat_of_vaporization: 154, molecular_weight: 84.16, liquid_density: 1413 },
  { id: 7, fluid_name: 'Dimethylamine', heat_of_vaporization: 250, molecular_weight: 45.08, liquid_density: 1679 },
  { id: 8, fluid_name: 'Ethanol', heat_of_vaporization: 368, molecular_weight: 46.07, liquid_density: 2498 },
  { id: 9, fluid_name: 'Ethyl acetate', heat_of_vaporization: 157, molecular_weight: 88.11, liquid_density: 1474 },
  { id: 10, fluid_name: 'Gasoline', heat_of_vaporization: 145, molecular_weight: 96, liquid_density: 1421 },
  { id: 11, fluid_name: 'Heptane', heat_of_vaporization: 137, molecular_weight: 100.2, liquid_density: 1371 },
  { id: 12, fluid_name: 'Hexane', heat_of_vaporization: 144, molecular_weight: 86.17, liquid_density: 1357 },
  { id: 13, fluid_name: 'Methanol', heat_of_vaporization: 474, molecular_weight: 32.04, liquid_density: 2663 },
  { id: 14, fluid_name: 'Methylene Chloride', heat_of_vaporization: 122, molecular_weight: 84.93, liquid_density: 1124 },
  { id: 15, fluid_name: 'Nitrogen', heat_of_vaporization: 86, molecular_weight: 28, liquid_density: 455 },
  { id: 16, fluid_name: 'Octane', heat_of_vaporization: 132, molecular_weight: 114.22, liquid_density: 1411 },
  { id: 17, fluid_name: 'Pentane', heat_of_vaporization: 153, molecular_weight: 72.15, liquid_density: 1300 },
  { id: 18, fluid_name: 'Toluene', heat_of_vaporization: 156, molecular_weight: 92.13, liquid_density: 1497 },
  { id: 19, fluid_name: 'Vinyl acetate', heat_of_vaporization: 165, molecular_weight: 86.09, liquid_density: 1532 },
  { id: 20, fluid_name: 'Water', heat_of_vaporization: 970, molecular_weight: 18.01, liquid_density: 4111 }
]

// Heat input calculation formulas
export interface HeatInputFormula {
  areaRangeMin: number // sq ft
  areaRangeMax: number | null // sq ft, null for unlimited
  formula: string // Formula as string for display
  coefficient: number
  exponent: number
  description?: string
}

// NFPA 30 (2018) Heat Input Formulas
const HEAT_INPUT_FORMULAS_NFPA: HeatInputFormula[] = [
  { areaRangeMin: 20, areaRangeMax: 200, formula: '20,000A', coefficient: 20000, exponent: 1.0, description: 'Area 20-200 sq ft' },
  { areaRangeMin: 200, areaRangeMax: 1000, formula: '199,300A^0.566', coefficient: 199300, exponent: 0.566, description: 'Area 200-1000 sq ft' },
  { areaRangeMin: 1000, areaRangeMax: 2800, formula: '963,400A^0.338', coefficient: 963400, exponent: 0.338, description: 'Area 1000-2800 sq ft' },
  { areaRangeMin: 2800, areaRangeMax: null, formula: '21,000A^0.82', coefficient: 21000, exponent: 0.82, description: 'Area >2800 sq ft' }
]

// API 521 (2000) Heat Input Formulas
export interface API521Formula extends HeatInputFormula {
  formulaType: 'small' | 'large' | 'no_drainage'
}

const HEAT_INPUT_FORMULAS_API: API521Formula[] = [
  { areaRangeMin: 0, areaRangeMax: null, formula: '21,000FA^-0.18', coefficient: 21000, exponent: -0.18, formulaType: 'small', description: 'Small fires (q)' },
  { areaRangeMin: 0, areaRangeMax: null, formula: '21,000FA^0.82', coefficient: 21000, exponent: 0.82, formulaType: 'large', description: 'Large fires (Q)' },
  { areaRangeMin: 0, areaRangeMax: null, formula: '34,500FA^0.82', coefficient: 34500, exponent: 0.82, formulaType: 'no_drainage', description: 'No adequate drainage/firefighting (Q)' }
]

/**
 * Get heat input formulas for a given standard
 */
export function getHeatInputFormulas(standard: 'NFPA 30' | 'API 521'): HeatInputFormula[] {
  return standard === 'NFPA 30' ? HEAT_INPUT_FORMULAS_NFPA : HEAT_INPUT_FORMULAS_API
}

/**
 * Get the appropriate heat input formula based on standard and area
 */
export function getHeatInputFormula(
  standard: 'NFPA 30' | 'API 521', 
  area: number,
  hasAdequateDrainageFirefighting?: boolean
): HeatInputFormula | null {
  if (standard === 'NFPA 30') {
    // Find the appropriate NFPA 30 formula based on area range
    for (const formula of HEAT_INPUT_FORMULAS_NFPA) {
      if (area >= formula.areaRangeMin && 
          (formula.areaRangeMax === null || area <= formula.areaRangeMax)) {
        return formula
      }
    }
  } else if (standard === 'API 521') {
    // For API 521, choice depends on drainage/firefighting equipment
    if (hasAdequateDrainageFirefighting === false) {
      // No adequate drainage/firefighting - use 34,500FA^0.82
      return HEAT_INPUT_FORMULAS_API.find(f => f.formulaType === 'no_drainage') || null
    } else {
      // Has adequate drainage/firefighting - use 21,000FA^0.82 (large fires)
      return HEAT_INPUT_FORMULAS_API.find(f => f.formulaType === 'large') || null
    }
  }
  
  return null
}

/**
 * Calculate heat input (Q) using the appropriate formula
 */
export function calculateHeatInput(
  standard: 'NFPA 30' | 'API 521',
  area: number,
  hasAdequateDrainageFirefighting?: boolean
): { heatInput: number; formula: HeatInputFormula } | null {
  const formula = getHeatInputFormula(standard, area, hasAdequateDrainageFirefighting)
  if (!formula) return null
  
  // For API 521, F factor is assumed to be 1.0 for simplicity
  const F = 1.0
  const heatInput = formula.coefficient * Math.pow(area, formula.exponent) * (standard === 'API 521' ? F : 1)
  
  return { heatInput, formula }
}

/**
 * Get all available fluid names for dropdown/autocomplete
 */
export function getFluidNames(): string[] {
  return FLUID_PROPERTIES.map(fluid => fluid.fluid_name).sort()
}

/**
 * Get fluid properties by name
 */
export function getFluidProperties(fluidName: string): FluidProperty | null {
  return FLUID_PROPERTIES.find(
    fluid => fluid.fluid_name.toLowerCase() === fluidName.toLowerCase()
  ) || null
}

// Standard vessel diameters (from your table)
const STANDARD_DIAMETERS = [
  4.5, 5.583, 6.625, 8.625, 10.75, 12.75, 14, 16, 18, 20, 22, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120, 126, 132, 138, 144, 156, 168
]

/**
 * Get available standard vessel diameters
 */
export function getStandardDiameters(): number[] {
  return [...STANDARD_DIAMETERS]
}

/**
 * Get vessel head area by diameter and head type
 * Uses proper formulas for smaller diameters and lookup for larger ones
 */
export function getVesselHeadArea(
  diameter: number, 
  headType: 'Elliptical' | 'Hemispherical' | 'Flat'
): number {
  if (!diameter || diameter <= 0) return 0
  
  switch (headType) {
    case 'Flat':
      // Formula: A = (diameter/2)^2 * PI / 144
      return Math.pow(diameter / 2, 2) * Math.PI / 144
      
    case 'Hemispherical':
      // Formula: A = diameter^2 / 144 * 1.57 (up to 6 5/8")
      if (diameter <= 6.625) {
        return Math.pow(diameter, 2) / 144 * 1.57
      }
      // For larger diameters, use lookup table values
      return getHemisphericalAreaFromTable(diameter)
      
    case 'Elliptical':
      // Use lookup table for elliptical heads
      return getEllipticalAreaFromTable(diameter)
      
    default:
      return 0
  }
}

// Lookup functions for larger diameters (hardcoded from your table)
function getHemisphericalAreaFromTable(diameter: number): number {
  const lookupTable: { [key: number]: number } = {
    8.625: 0.48, 10.75: 0.75, 12.75: 1.05, 14: 1.32, 16: 1.65, 18: 2.09, 20: 2.59, 22: 3.13, 24: 3.72, 30: 5.82, 36: 8.38, 42: 11.40, 48: 14.89, 54: 18.84, 60: 23.04, 66: 28.15, 72: 33.50, 78: 39.32, 84: 45.60, 90: 52.35, 96: 59.56, 102: 67.23, 108: 75.38, 114: 83.99, 120: 93.06, 126: 102.60, 132: 112.60, 138: 123.07, 144: 134.00, 156: 171.79, 168: 199.24
  }
  return lookupTable[diameter] || 0
}

function getEllipticalAreaFromTable(diameter: number): number {
  const lookupTable: { [key: number]: number } = {
    4.5: 0.1524, 5.583: 0.233, 6.625: 0.33, 8.625: 0.56, 10.75: 0.87, 12.75: 1.22, 14: 1.46, 16: 1.91, 18: 2.42, 20: 2.99, 22: 3.61, 24: 4.30, 30: 6.72, 36: 9.68, 42: 13.18, 48: 17.21, 54: 21.79, 60: 26.88, 66: 32.53, 72: 38.75, 78: 45.43, 84: 52.70, 90: 60.49, 96: 70.25, 102: 77.69, 108: 87.15, 114: 98.18, 120: 107.53, 126: 118.62, 132: 130.24, 138: 142.31, 144: 155.06, 156: 206.77, 168: 239.81
  }
  return lookupTable[diameter] || 0
}

/**
 * Calculate fire exposed area based on vessel dimensions and fire code
 * This replaces the simple calculation in VesselContext
 */
export function calculateFireExposedArea(
  vesselDiameter: number, // inches
  straightSideHeight: number, // inches
  headType: 'Elliptical' | 'Hemispherical' | 'Flat',
  fireCode: 'NFPA 30' | 'API 521'
): number {
  if (!vesselDiameter || !straightSideHeight) return 0
  
  const radius = vesselDiameter / 2 / 12 // Convert inches to feet
  const height = straightSideHeight / 12 // Convert inches to feet
  
  // Cylindrical surface area (always exposed)
  const cylindricalArea = 2 * Math.PI * radius * height
  
  // Head area from lookup table
  const headArea = getVesselHeadArea(vesselDiameter, headType)
  
  // Total exposed area (typically one head + cylindrical surface)
  // Different fire codes might have different calculation methods
  const totalArea = cylindricalArea + headArea
  
  // Apply fire code specific factors if needed
  if (fireCode === 'API 521') {
    // API 521 might have different calculation factors
    return totalArea * 1.0 // No modification for now
  }
  
  return totalArea
}
