/**
 * database.ts
 * 
 * Engineering datasets and calculation functions for pressure relief valve sizing.
 * Currently uses in-memory data structures, designed to be replaced with SQLite/API calls.
 * 
 * Key Features:
 * - Fluid property lookups (heat of vaporization, molecular weight, density)
 * - Vessel geometry calculations (head areas, fire exposed areas)
 * - Heat input formulas from NFPA 30 and API 521
 * - Environmental factor calculations per API 521 (insulation, storage type)
 * - API 521 compliance: 25 ft height limit, sphere logic, support skirts
 * - Standard vessel dimensions and lookup tables
 * 
 * API 521 Enhancements:
 * - Wetted surface area limited to ≤25 ft above fire source (API 521 §4.4.13.2.2)
 * - Sphere-specific rules for bottom hemisphere (API 521 Table 4)
 * - Support skirt exclusion logic (API 521 §4.4.13.2.2)
 * - Environmental factor F for insulation credit (API 521 §4.4.13.2.7.4, Eq 16/17)
 * - Storage type factors: earth-covered (F=0.03), below-grade (F=0.0)
 * 
 * Note: The nitrogen control failure case is under development and will require
 * additional formulas and lookup tables for nitrogen-specific calculations.
 */

/**
 * Properties of a working fluid used in relief calculations.
 * Values from industry standard tables and handbooks.
 */
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

/**
 * Insulation Material Properties
 * From API 521 Table 6: Thermal Conductivity Values for Typical Thermal Insulations
 * 
 * Note: k values are at mean temperature between fire temp (~1660°F) and process temp
 * For fire-rated insulation credit per API 521:
 * - Must withstand 1660°F for up to 2 hours
 * - Must resist dislodgment by fire hose streams
 * - Stainless steel jacketing recommended
 */
export interface InsulationMaterial {
  id: number
  name: string
  /** Thermal conductivity at 1000°F, Btu·in/(h·ft²·°F) */
  thermalConductivity_1000F: number
  /** Maximum use temperature, °F */
  maxTemp: number
  description: string
}

const INSULATION_MATERIALS: InsulationMaterial[] = [
  { 
    id: 1, 
    name: 'Calcium Silicate Type I', 
    thermalConductivity_1000F: 0.77, 
    maxTemp: 1200,
    description: 'Common fire-rated insulation for pressure vessels'
  },
  { 
    id: 2, 
    name: 'Calcium Silicate Type II', 
    thermalConductivity_1000F: 0.77, 
    maxTemp: 1700,
    description: 'High-temperature calcium silicate, suitable for fire protection'
  },
  { 
    id: 3, 
    name: 'Mineral Fiber Blanket/Block', 
    thermalConductivity_1000F: 0.70, 
    maxTemp: 1200,
    description: 'Rock, slag, or glass fiber insulation'
  },
  { 
    id: 4, 
    name: 'Cellular Glass Type I', 
    thermalConductivity_1000F: 0.63, 
    maxTemp: 900,
    description: 'Lower temperature limit, not suitable for all fire scenarios'
  },
  { 
    id: 5, 
    name: 'Lightweight Cementitious', 
    thermalConductivity_1000F: 3.6, 
    maxTemp: 2000,
    description: 'High-temperature fire protection, higher conductivity'
  },
  { 
    id: 6, 
    name: 'Dense Cementitious', 
    thermalConductivity_1000F: 10.5, 
    maxTemp: 2000,
    description: 'Very high temperature, but high conductivity reduces credit'
  }
]

/**
 * Get available insulation materials
 */
export function getInsulationMaterials(): InsulationMaterial[] {
  return [...INSULATION_MATERIALS]
}

/**
 * Get insulation material by name
 */
export function getInsulationMaterial(name: string): InsulationMaterial | null {
  return INSULATION_MATERIALS.find(m => m.name === name) || null
}

/**
 * Storage type options for environmental factor calculation
 * Per API 521 Table 5
 */
export type StorageType = 'above-grade' | 'earth-covered' | 'below-grade'

/**
 * Vessel orientation types
 * Affects wetted surface area calculation per API 521 Table 4
 */
export type VesselOrientation = 'vertical' | 'horizontal' | 'sphere'

/**
 * Environmental Factor Parameters for API 521
 * Used to calculate F factor in heat input equations
 */
export interface EnvironmentalFactorParams {
  /** Storage type: affects base F value */
  storageType?: StorageType
  /** Insulation material name (if insulated) */
  insulationMaterial?: string
  /** Insulation thickness, inches */
  insulationThickness?: number
  /** Process temperature at relieving conditions, °F */
  processTemperature?: number
}

/**
 * Calculate Environmental Factor F per API 521
 * 
 * API 521 §4.4.13.2.7.4, Equations (16) and (17):
 * F = (k / δ_ins) × [1 / (1660°F - T_f)] × conversion_factor
 * 
 * Where:
 * - k = thermal conductivity at mean temperature, Btu·in/(h·ft²·°F)
 * - δ_ins = insulation thickness, inches
 * - T_f = process temperature at relieving conditions, °F
 * 
 * Special Cases per API 521 Table 5:
 * - Bare vessel: F = 1.0
 * - Earth-covered: F = 0.03
 * - Below-grade: F = 0.0
 * - Water spray on bare vessel: F = 1.0 (no reduction per §4.4.13.2.6.2)
 * 
 * @returns Environmental factor F (dimensionless), or null if invalid inputs
 */
export function calculateEnvironmentalFactor(params: EnvironmentalFactorParams): number {
  const { storageType, insulationMaterial, insulationThickness, processTemperature } = params
  
  // Special storage types override insulation (API 521 Table 5)
  if (storageType === 'below-grade') {
    return 0.0 // No heat input for below-grade storage
  }
  if (storageType === 'earth-covered') {
    return 0.03 // Minimal heat input for earth-covered
  }
  
  // If insulated, calculate F from insulation properties
  if (insulationMaterial && insulationThickness && processTemperature !== undefined) {
    const material = getInsulationMaterial(insulationMaterial)
    if (!material) {
      console.warn(`Unknown insulation material: ${insulationMaterial}`)
      return 1.0 // Default to bare vessel
    }
    
    // Validate insulation is fire-rated
    if (material.maxTemp < 1200) {
      console.warn(`Insulation max temp ${material.maxTemp}°F < 1200°F minimum for fire credit`)
      return 1.0 // Cannot take credit
    }
    
    // API 521 Equation (17) in USC units:
    // F = [k / δ_ins] × [1 / (1660 - T_f)] × 260
    const k = material.thermalConductivity_1000F // Btu·in/(h·ft²·°F)
    const deltaIns = insulationThickness // inches
    const fireTempF = 1660 // °F, per API 521 §4.4.13.2.7.2
    const tempDiff = fireTempF - processTemperature // °F
    
    if (tempDiff <= 0) {
      console.warn('Process temperature exceeds fire temperature - cannot calculate F factor')
      return 1.0
    }
    
    // USC conversion factor from API 521 Equation (17)
    const conversionFactor = 260
    const F = (k / deltaIns) * (1 / tempDiff) * conversionFactor
    
    // Sanity check: F should be between 0 and 1 for insulated vessels
    if (F < 0 || F > 1) {
      console.warn(`Calculated F factor ${F.toFixed(4)} out of range [0, 1]`)
      return Math.max(0, Math.min(1, F)) // Clamp to valid range
    }
    
    return F
  }
  
  // Default: bare vessel (API 521 Table 5, note e)
  return 1.0
}

/**
 * Heat Input Formula Interface
 * 
 * Represents a formula used to calculate heat input (Q) based on wetted surface area.
 * Different formulas apply to different area ranges and conditions.
 * 
 * General form: Q = C * F * A^n
 * where:
 * - Q = Heat input (BTU/hr)
 * - C = Coefficient (varies by standard)
 * - F = Environmental factor (API 521 only)
 * - A = Wetted surface area (sq ft)
 * - n = Exponent (varies by standard)
 */
export interface HeatInputFormula {
  areaRangeMin: number     // Minimum area where formula applies (sq ft)
  areaRangeMax: number | null  // Maximum area, null for unlimited (sq ft)
  formula: string          // Human-readable formula for display
  coefficient: number      // C in Q = C * A^n
  exponent: number        // n in Q = C * A^n
  description?: string    // Additional context about when to use this formula
}

/**
 * NFPA 30 (2018) Heat Input Formulas
 * 
 * Piecewise function based on wetted surface area:
 * - 20-200 sq ft: Linear relationship
 * - 200-1000 sq ft: Reduced growth rate
 * - 1000-2800 sq ft: Further reduced growth
 * - >2800 sq ft: Standard large vessel formula
 */
const HEAT_INPUT_FORMULAS_NFPA: HeatInputFormula[] = [
  { areaRangeMin: 20, areaRangeMax: 200, formula: '20,000A', coefficient: 20000, exponent: 1.0, description: 'Area 20-200 sq ft' },
  { areaRangeMin: 200, areaRangeMax: 1000, formula: '199,300A^0.566', coefficient: 199300, exponent: 0.566, description: 'Area 200-1000 sq ft' },
  { areaRangeMin: 1000, areaRangeMax: 2800, formula: '963,400A^0.338', coefficient: 963400, exponent: 0.338, description: 'Area 1000-2800 sq ft' },
  { areaRangeMin: 2800, areaRangeMax: null, formula: '21,000A^0.82', coefficient: 21000, exponent: 0.82, description: 'Area >2800 sq ft' }
]

/**
 * API 521 (2000) Heat Input Formulas
 * 
 * API 521 formulas consider:
 * - Fire size (small vs large)
 * - Drainage and firefighting conditions
 * - Environmental factor F (default 1.0)
 * 
 * Key differences from NFPA 30:
 * - No piecewise function
 * - Considers drainage conditions
 * - Uses environmental factor F
 */
export interface API521Formula extends HeatInputFormula {
  formulaType: 'small' | 'large' | 'no_drainage'  // Type of fire scenario
}

/**
 * API 521 formula variations:
 * - Small fires: Lower heat input for localized fires
 * - Large fires with drainage: Standard heat input
 * - Large fires without drainage: Higher heat input (1.64x)
 */
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
 * 
 * @param standard - Fire code: NFPA 30 or API 521
 * @param area - Wetted surface area (sq ft)
 * @param hasAdequateDrainageFirefighting - For API 521: adequate drainage/firefighting?
 * @param environmentalFactor - For API 521: F factor (default 1.0 for bare vessel)
 * @returns Heat input result with formula used, or null if invalid
 */
export function calculateHeatInput(
  standard: 'NFPA 30' | 'API 521',
  area: number,
  hasAdequateDrainageFirefighting?: boolean,
  environmentalFactor?: number
): { heatInput: number; formula: HeatInputFormula; environmentalFactor?: number } | null {
  const formula = getHeatInputFormula(standard, area, hasAdequateDrainageFirefighting)
  if (!formula) return null
  
  // For API 521, apply environmental factor F (default 1.0 for bare vessel)
  // For NFPA 30, F factor not used in heat input calculation
  const F = standard === 'API 521' ? (environmentalFactor ?? 1.0) : 1.0
  const heatInput = formula.coefficient * Math.pow(area, formula.exponent) * (standard === 'API 521' ? F : 1)
  
  return { 
    heatInput, 
    formula,
    ...(standard === 'API 521' && { environmentalFactor: F })
  }
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
 * Parameters for fire exposed area calculation
 * Enhanced to support API 521 requirements
 */
export interface FireExposedAreaParams {
  vesselDiameter: number // inches
  straightSideHeight: number // inches
  headType: 'Elliptical' | 'Hemispherical' | 'Flat'
  fireCode: 'NFPA 30' | 'API 521'
  
  // API 521 specific parameters
  vesselOrientation?: VesselOrientation // Default: 'vertical'
  headProtectedBySkirt?: boolean // Default: false
  fireSourceElevation?: number // feet above grade, default: 0
}

/**
 * Calculate fire exposed (wetted) area per API 521 §4.4.13.2.2 and Table 4
 * 
 * Key API 521 Requirements:
 * 1. Only wetted surface ≤25 ft above fire source is included
 * 2. Spheres: minimum bottom hemisphere, even if equator >25 ft
 * 3. Heads protected by support skirts with limited ventilation excluded
 * 4. Portions in contact with foundations/ground normally excluded
 * 
 * NFPA 30: Generally follows similar principles but less specific
 * 
 * @param params - Fire exposed area calculation parameters
 * @returns Wetted surface area in square feet
 */
export function calculateFireExposedArea(params: FireExposedAreaParams): number {
  const {
    vesselDiameter,
    straightSideHeight,
    headType,
    fireCode,
    vesselOrientation = 'vertical',
    headProtectedBySkirt = false,
    fireSourceElevation = 0 // Grade level by default
  } = params
  
  if (!vesselDiameter || vesselDiameter <= 0 || !straightSideHeight || straightSideHeight <= 0) {
    return 0
  }
  
  const radius = vesselDiameter / 2 / 12 // Convert inches to feet
  const diameterFt = vesselDiameter / 12 // feet
  const heightFt = straightSideHeight / 12 // feet
  
  // API 521: Maximum height above fire source for wetted area consideration
  const maxHeightAboveFire = fireCode === 'API 521' ? 25 : 9999 // 25 ft per API 521 §4.4.13.2.2
  
  // Calculate wetted area based on vessel orientation
  if (vesselOrientation === 'sphere') {
    const sphereRadius = diameterFt / 2
    const totalSphereArea = 4 * Math.PI * Math.pow(sphereRadius, 2) // Total sphere surface
    
    if (fireCode === 'NFPA 30') {
      // NFPA 30 §22.7.3.2.3: "Fifty-five percent of the total exposed area of a sphere or spheroid"
      return totalSphereArea * 0.55
    } else {
      // API 521 Table 4: Spheres and spheroids
      // "Up to the maximum horizontal diameter or up to the height of 7.6 m (25 ft), whichever is greater"
      // This means: entire bottom hemisphere minimum, even if equator > 25 ft
      
      const bottomHemisphereArea = 2 * Math.PI * Math.pow(sphereRadius, 2) // Half of sphere surface
      
      // Check if equator is above 25 ft
      const equatorHeight = sphereRadius // Height of center from bottom
      
      if (equatorHeight <= maxHeightAboveFire) {
        // Entire bottom hemisphere exposed
        return bottomHemisphereArea
      } else {
        // Equator > 25 ft, but still use entire bottom hemisphere per API 521
        // "as a minimum, the wetted surface area of the entire bottom hemisphere shall be used"
        return bottomHemisphereArea
      }
    }
  }
  
  // For vertical and horizontal vessels
  let wettedArea = 0
  
  // Determine effective height to consider (capped at 25 ft above fire source)
  const effectiveHeightLimit = fireSourceElevation + maxHeightAboveFire
  const effectiveHeight = Math.min(heightFt, effectiveHeightLimit)
  
  if (effectiveHeight <= 0) {
    // Vessel entirely above height limit
    return 0
  }
  
  // Cylindrical surface area (wetted portion only)
  const cylindricalArea = 2 * Math.PI * radius * effectiveHeight
  wettedArea += cylindricalArea
  
  // Head area from lookup table
  const headArea = getVesselHeadArea(vesselDiameter, headType)
  
  // Add bottom head if not protected by skirt
  // API 521: "vessel heads protected by support skirts with limited ventilation
  // are normally not included when determining wetted area"
  if (!headProtectedBySkirt) {
    wettedArea += headArea
  }
  
  // For vertical vessels, check if top head is within fire exposure height
  if (vesselOrientation === 'vertical') {
    const topHeadHeight = heightFt
    if (topHeadHeight <= effectiveHeightLimit) {
      // Top head within exposure zone - include it
      wettedArea += headArea
    }
  }
  
  // For horizontal vessels, both heads typically included if vessel within height limit
  if (vesselOrientation === 'horizontal' && effectiveHeight >= heightFt) {
    // Add second head (first one already added if not protected by skirt)
    if (!headProtectedBySkirt) {
      wettedArea += headArea // Both ends
    } else {
      wettedArea += headArea // Only one end (other protected)
    }
  }
  
  return wettedArea
}
