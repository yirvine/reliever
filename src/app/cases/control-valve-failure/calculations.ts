/**
 * Control Valve Failure Flow Calculations (Gas Service)
 * 
 * Implements ISA gas flow formulas per API 520 for control valve failure scenarios.
 * Uses Imperial units (SCFH, lb/hr, psig, °F) for consistency with industry standards.
 * 
 * Standards References:
 * - ASME Section VIII Div. 1 UG-125/UG-131: Accumulation limits (110%, 116%, 121%)
 * - API-521 Section 4.4.8: Failure of Automatic Controls
 * - API-520 Part I: Valve sizing equations (ISA-S75.01 gas flow formulas)
 */

// Unit conversion constants
const LB_TO_KG = 0.453592
const HOUR_TO_SECOND = 3600
const SCFH_TO_LBHR_FACTOR = 379 // Standard cubic feet per hour conversion factor

/**
 * Convert flow rate from any unit to lb/hr (internal storage unit)
 */
export function convertToLbPerHr(
  value: number,
  unit: ManualFlowUnit,
  molecularWeight: number
): number {
  if (!value || value <= 0) return 0

  switch (unit) {
    case 'lb/hr':
      return value
    case 'SCFH':
      // SCFH to lb/hr: lb/hr = (SCFH / 379) * MW
      return (value / SCFH_TO_LBHR_FACTOR) * molecularWeight
    case 'kg/hr':
      // kg/hr to lb/hr: lb/hr = kg/hr / 0.453592
      return value / LB_TO_KG
    case 'kg/s':
      // kg/s to lb/hr: lb/hr = (kg/s * 3600) / 0.453592
      return (value * HOUR_TO_SECOND) / LB_TO_KG
    default:
      return value
  }
}

/**
 * Convert flow rate from lb/hr (internal storage unit) to any unit
 */
export function convertFromLbPerHr(
  valueLbPerHr: number,
  unit: ManualFlowUnit,
  molecularWeight: number
): number {
  if (!valueLbPerHr || valueLbPerHr <= 0) return 0

  switch (unit) {
    case 'lb/hr':
      return valueLbPerHr
    case 'SCFH':
      // lb/hr to SCFH: SCFH = (lb/hr / MW) * 379
      return (valueLbPerHr / molecularWeight) * SCFH_TO_LBHR_FACTOR
    case 'kg/hr':
      // lb/hr to kg/hr: kg/hr = lb/hr * 0.453592
      return valueLbPerHr * LB_TO_KG
    case 'kg/s':
      // lb/hr to kg/s: kg/s = (lb/hr * 0.453592) / 3600
      return (valueLbPerHr * LB_TO_KG) / HOUR_TO_SECOND
    default:
      return valueLbPerHr
  }
}

export interface GasProperties {
  name: string
  displayName: string        // name with chemical formula for UI display
  molecularWeight: number    // lb/lbmol
  specificGravity: number    // relative to air
  defaultZ: number           // typical compressibility factor
}

export type ManualFlowUnit = 'lb/hr' | 'SCFH' | 'kg/hr' | 'kg/s'

export interface GasFlowInputs {
  isManualFlowInput: boolean
  manualFlowRate?: number     // mass flow (stored in lb/hr internally for calculations)
  manualFlowRateRaw?: number // raw value entered by user (displayed value, unit-agnostic)
  manualFlowUnit?: ManualFlowUnit  // unit for manual flow rate input
  totalCv?: number            // control valve flow coefficient
  bypassCv?: number           // bypass valve Cv (if applicable)
  considerBypass?: boolean    // whether to include bypass valve
  inletPressure?: number      // psig - maximum upstream supply pressure
  outletPressure?: number     // psig - vessel relieving pressure
  temperatureF?: number       // °F (user editable)
  compressibilityZ?: number   // Z factor (user editable)
  xt?: number                 // pressure drop ratio factor
  gasProperties?: GasProperties  // selected gas properties
  outletFlowCredit?: number   // SCFH - normal outlet flow to credit
  creditOutletFlow?: boolean  // whether to apply outlet flow credit
  selectedGas?: string        // selected gas key for persistence
  customGasProps?: GasProperties  // custom gas properties if applicable
}

export interface CalculationResult {
  calculatedRelievingFlow: number | null  // SCFH (gross inlet flow)
  netRelievingFlow: number | null         // SCFH (after outlet credit)
  massFlowRate: number | null             // lb/hr
  api520ValveInflow: number | null        // SCFH
  reason: string | null
  errors: string[]
  warnings: string[]
  flowRegime?: 'Manual Input' | 'Choked Flow' | 'Sub-critical Flow'
  equationPath?: 'manual' | 'choked' | 'non-choked'
  effectiveCv?: number                    // total Cv including bypass
  outletCreditApplied?: number            // SCFH credited
}

/**
 * Common gas properties database for control valve failure calculations
 * 
 * Properties Source:
 * - Molecular Weights: NIST Chemistry WebBook (https://webbook.nist.gov)
 * - Specific Gravities: Calculated as MW_gas / MW_air where MW_air = 28.97 lb/lbmol
 * - Compressibility Factors (Z): Perry's Chemical Engineers' Handbook, 9th Edition
 * 
 * Note: These are gaseous compound properties. The app's fluid properties database 
 * (datasets/fluids) contains liquid properties (heat of vaporization, liquid density)
 * used for different scenarios like external fire calculations.
 * 
 * API-521 and API-520 References:
 * - API-520 Part I Section 5: Gas and Vapor Relief
 * - Requires molecular weight and specific gravity for ISA gas flow formulas
 */
export const COMMON_GASES: Record<string, GasProperties> = {
  nitrogen: {
    name: 'Nitrogen',
    displayName: 'Nitrogen (N₂)',
    molecularWeight: 28.0134,    // NIST: Diatomic nitrogen at STP
    specificGravity: 0.967,      // 28.0134 / 28.97 (relative to air)
    defaultZ: 1.0                // Near-ideal behavior at typical conditions
  },
  air: {
    name: 'Air',
    displayName: 'Air',
    molecularWeight: 28.97,      // Standard dry air composition
    specificGravity: 1.0,        // Reference gas (by definition)
    defaultZ: 1.0                // Ideal at typical process conditions
  },
  oxygen: {
    name: 'Oxygen',
    displayName: 'Oxygen (O₂)',
    molecularWeight: 32.0,       // NIST: Diatomic oxygen at STP
    specificGravity: 1.105,      // 32.0 / 28.97
    defaultZ: 1.0                // Near-ideal behavior
  },
  co2: {
    name: 'Carbon Dioxide',
    displayName: 'Carbon Dioxide (CO₂)',
    molecularWeight: 44.01,      // NIST: CO₂ at STP
    specificGravity: 1.52,       // 44.01 / 28.97
    defaultZ: 0.99               // Slight deviation from ideal at moderate pressures
  },
  methane: {
    name: 'Methane',
    displayName: 'Methane (CH₄)',
    molecularWeight: 16.04,      // NIST: CH₄ at STP
    specificGravity: 0.554,      // 16.04 / 28.97
    defaultZ: 0.998              // Nearly ideal, slight deviation
  },
  custom: {
    name: 'Custom Gas',
    displayName: 'Custom Gas',
    molecularWeight: 28.0134,  // default placeholder (nitrogen)
    specificGravity: 1.0,       // default placeholder (air)
    defaultZ: 1.0               // default placeholder (ideal)
  }
}

// Default gas properties (Nitrogen for backwards compatibility)
export const DEFAULT_GAS_PROPERTIES = COMMON_GASES.nitrogen

// Legacy export for backwards compatibility
export const NITROGEN_CONSTANTS = {
  specificGravity: DEFAULT_GAS_PROPERTIES.specificGravity,
  molecularWeight: DEFAULT_GAS_PROPERTIES.molecularWeight,
  temperatureF: 80,          // °F
  compressibilityZ: 1.0,     // Near-ideal behavior
  xt: 0.7                    // Typical globe valve
}

// Maintain backwards compatibility with old interface name
export type NitrogenFlowInputs = GasFlowInputs

// Unit conversion constants (Imperial only)
export const UNIT_CONSTANTS = {
  // SCFH conversion: SCFH = (lb/hr / MW) * 379
  scfhConversion: 379,
  // ISA gas flow constant for SCFH
  isaConstant: 1360,
  // Pressure conversion: psig to psia
  pressureOffset: 14.7,
  // Temperature conversion: °F to °R
  temperatureOffset: 459.67
}

/**
 * Calculate gas flow using ISA gas flow formulas
 * Supports any gas type via gasProperties parameter
 */
export function calculateNitrogenFlow(inputs: GasFlowInputs): CalculationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    if (inputs.isManualFlowInput) {
      return calculateManualFlow(inputs, errors, warnings)
    } else {
      return calculatePressureBasedFlow(inputs, errors, warnings)
    }
  } catch {
    return {
      calculatedRelievingFlow: null,
      netRelievingFlow: null,
      massFlowRate: null,
      api520ValveInflow: null,
      reason: 'Calculation error',
      errors: ['Unexpected calculation error'],
      warnings: []
    }
  }
}

function calculateManualFlow(
  inputs: GasFlowInputs,
  errors: string[],
  warnings: string[]
): CalculationResult {
  if (!inputs.manualFlowRate || inputs.manualFlowRate <= 0) {
    errors.push('No manual flow rate entered')
    return {
      calculatedRelievingFlow: null,
      netRelievingFlow: null,
      massFlowRate: null,
      api520ValveInflow: null,
      reason: 'No manual flow rate entered',
      errors,
      warnings
    }
  }

  // Get gas properties (use nitrogen as default if not provided)
  const gasProps = inputs.gasProperties || DEFAULT_GAS_PROPERTIES

  // Convert lb/hr to SCFH: SCFH = (lb/hr / MW) * 379
  const volumetricFlow = (inputs.manualFlowRate / gasProps.molecularWeight) * UNIT_CONSTANTS.scfhConversion
  
  // Apply outlet flow credit if enabled
  let netFlow = volumetricFlow
  let outletCreditApplied = 0
  
  if (inputs.creditOutletFlow && inputs.outletFlowCredit && inputs.outletFlowCredit > 0) {
    outletCreditApplied = inputs.outletFlowCredit
    netFlow = Math.max(0, volumetricFlow - inputs.outletFlowCredit)
    
    if (netFlow <= 0) {
      warnings.push('Outlet flow credit equals or exceeds inlet flow - no relief required')
    }
  }
  
  return {
    calculatedRelievingFlow: Math.round(volumetricFlow),
    netRelievingFlow: Math.round(netFlow),
    massFlowRate: Math.round(inputs.manualFlowRate),
    api520ValveInflow: Math.round(netFlow),
    outletCreditApplied: Math.round(outletCreditApplied),
    reason: null,
    errors,
    warnings,
    flowRegime: 'Manual Input',
    equationPath: 'manual'
  }
}

function calculatePressureBasedFlow(
  inputs: GasFlowInputs,
  errors: string[],
  warnings: string[]
): CalculationResult {
  const { totalCv, inletPressure, outletPressure, bypassCv, considerBypass } = inputs
  
  // Calculate effective Cv (control valve + bypass if applicable)
  let effectiveCv = totalCv || 0
  if (considerBypass && bypassCv && bypassCv > 0) {
    effectiveCv = (totalCv || 0) + bypassCv
    warnings.push(`Bypass valve included: Total effective Cv = ${effectiveCv.toFixed(1)}`)
  }
  
  // Validation
  if (!effectiveCv || effectiveCv <= 0) {
    errors.push('Total Cv must be greater than 0')
  }
  if (inletPressure === undefined || inletPressure < 0) {
    errors.push('Inlet pressure must be non-negative')
  }
  if (outletPressure === undefined || outletPressure < 0) {
    errors.push('Outlet pressure must be non-negative')
  }
  
  if (errors.length > 0) {
    return {
      calculatedRelievingFlow: null,
      netRelievingFlow: null,
      massFlowRate: null,
      api520ValveInflow: null,
      reason: 'Missing or invalid pressure calculation inputs',
      errors,
      warnings
    }
  }

  // Get gas properties (use nitrogen as default if not provided)
  const gasProps = inputs.gasProperties || DEFAULT_GAS_PROPERTIES
  
  // Use user inputs or fall back to defaults
  const temperatureF = inputs.temperatureF ?? NITROGEN_CONSTANTS.temperatureF
  const compressibilityZ = inputs.compressibilityZ ?? gasProps.defaultZ
  const xt = inputs.xt ?? NITROGEN_CONSTANTS.xt
  const specificGravity = gasProps.specificGravity
  const molecularWeight = gasProps.molecularWeight

  // Convert to absolute pressures
  const P1 = inletPressure! + UNIT_CONSTANTS.pressureOffset
  const P2 = outletPressure! + UNIT_CONSTANTS.pressureOffset
  
  if (P2 >= P1) {
    errors.push('No forward pressure drop (outlet pressure ≥ inlet pressure)')
    return {
      calculatedRelievingFlow: 0,
      netRelievingFlow: 0,
      massFlowRate: 0,
      api520ValveInflow: 0,
      effectiveCv,
      outletCreditApplied: 0,
      reason: 'No forward pressure drop',
      errors,
      warnings
    }
  }

  // Convert temperature to absolute
  const T_abs = temperatureF + UNIT_CONSTANTS.temperatureOffset
  const Z = compressibilityZ
  const G = specificGravity
  const x = (P1 - P2) / P1

  // Choked flow check: x >= x_t
  const isChoked = x >= xt

  let Q_volumetric: number
  if (isChoked) {
    // Choked flow: Q = C * Cv * x_t * P1 / sqrt(G * T * Z)
    Q_volumetric = UNIT_CONSTANTS.isaConstant * effectiveCv * xt * P1 / Math.sqrt(G * T_abs * Z)
  } else {
    // Non-choked flow: Q = C * Cv * Y * P1 * sqrt(x / (G * T * Z))
    const Y = Math.max(2/3, 1 - x / (3 * xt))
    Q_volumetric = UNIT_CONSTANTS.isaConstant * effectiveCv * Y * P1 * Math.sqrt(x / (G * T_abs * Z))
  }

  // Apply outlet flow credit if enabled
  let netFlow = Q_volumetric
  let outletCreditApplied = 0
  
  if (inputs.creditOutletFlow && inputs.outletFlowCredit && inputs.outletFlowCredit > 0) {
    outletCreditApplied = inputs.outletFlowCredit
    netFlow = Math.max(0, Q_volumetric - inputs.outletFlowCredit)
    
    if (netFlow <= 0) {
      warnings.push('Outlet flow credit equals or exceeds inlet flow - no relief required')
    } else if (outletCreditApplied > Q_volumetric * 0.7) {
      warnings.push('Outlet flow credit is >70% of inlet flow - verify normal outlet capacity')
    }
  }

  // Convert to mass flow: lb/hr = (SCFH / 379) * MW
  const massFlowRate = (netFlow / UNIT_CONSTANTS.scfhConversion) * molecularWeight

  return {
    calculatedRelievingFlow: Math.round(Q_volumetric),
    netRelievingFlow: Math.round(netFlow),
    massFlowRate: Math.round(massFlowRate),
    api520ValveInflow: Math.round(netFlow),
    effectiveCv: Math.round(effectiveCv * 10) / 10,
    outletCreditApplied: Math.round(outletCreditApplied),
    reason: null,
    errors,
    warnings,
    flowRegime: isChoked ? 'Choked Flow' : 'Sub-critical Flow',
    equationPath: isChoked ? 'choked' : 'non-choked'
  }
}

/**
 * Validate input values and return warnings/errors
 */
export function validateInputs(inputs: GasFlowInputs): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (inputs.totalCv !== undefined && inputs.totalCv < 0) {
    errors.push('Total Cv cannot be negative')
  }
  
  if (inputs.bypassCv !== undefined && inputs.bypassCv < 0) {
    errors.push('Bypass Cv cannot be negative')
  }

  if (inputs.inletPressure !== undefined && inputs.inletPressure < 0) {
    errors.push('Inlet pressure cannot be negative')
  }

  if (inputs.outletPressure !== undefined && inputs.outletPressure < 0) {
    errors.push('Outlet pressure cannot be negative')
  }

  if (inputs.inletPressure !== undefined && inputs.outletPressure !== undefined && 
      inputs.outletPressure >= inputs.inletPressure) {
    warnings.push('Outlet pressure should be less than inlet pressure for forward flow')
  }
  
  if (inputs.outletFlowCredit !== undefined && inputs.outletFlowCredit < 0) {
    errors.push('Outlet flow credit cannot be negative')
  }
  
  if (inputs.creditOutletFlow && inputs.outletFlowCredit && 
      inputs.totalCv && inputs.inletPressure && inputs.outletPressure) {
    // Rough check if outlet credit seems too high
    const roughInletFlow = inputs.totalCv * 1000 // very rough estimate
    if (inputs.outletFlowCredit > roughInletFlow) {
      warnings.push('Outlet flow credit appears higher than expected inlet flow')
    }
  }

  if (inputs.temperatureF !== undefined && inputs.temperatureF < -50) {
    warnings.push('Very low temperature - verify compressibility factor Z')
  }

  if (inputs.temperatureF !== undefined && inputs.temperatureF > 200) {
    warnings.push('High temperature - verify compressibility factor Z')
  }

  if (inputs.compressibilityZ !== undefined && (inputs.compressibilityZ < 0.5 || inputs.compressibilityZ > 1.5)) {
    warnings.push('Compressibility factor Z outside typical range (0.5-1.5)')
  }

  return { errors, warnings }
}
