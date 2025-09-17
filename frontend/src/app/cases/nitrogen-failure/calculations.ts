/**
 * Nitrogen Control Failure Flow Calculations
 * 
 * Implements ISA gas flow formulas per API 520 for nitrogen control valve failure scenarios.
 * Uses Imperial units (SCFH, lb/hr, psig, °F) for consistency with industry standards.
 * 
 * Standards References:
 * - ASME Section VIII Div. 1 UG-125/UG-131: Accumulation limits (110%, 116%, 121%)
 * - API 521: Scenario definition (control valve failure open)
 * - API 520: Valve sizing equations
 */

export interface NitrogenFlowInputs {
  isManualFlowInput: boolean
  manualFlowRate?: number  // mass flow, lb/hr
  totalCv?: number
  inletPressure?: number   // psig
  outletPressure?: number  // psig
  temperatureF?: number    // °F (user editable)
  compressibilityZ?: number // Z factor (user editable)
  xt?: number             // pressure drop ratio factor
}

export interface CalculationResult {
  calculatedRelievingFlow: number | null  // SCFH
  massFlowRate: number | null             // lb/hr
  api520ValveInflow: number | null        // SCFH
  reason: string | null
  errors: string[]
  warnings: string[]
  flowRegime?: 'Manual Input' | 'Choked Flow' | 'Sub-critical Flow'
  equationPath?: 'manual' | 'choked' | 'non-choked'
}

// Nitrogen constants (Imperial units only)
export const NITROGEN_CONSTANTS = {
  specificGravity: 0.967,    // Nitrogen relative to air
  molecularWeight: 28.0134,  // lb/lbmol
  temperatureF: 80,          // °F
  compressibilityZ: 1.0,     // Near-ideal behavior
  xt: 0.7                    // Typical globe valve
}

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
 * Calculate nitrogen flow using ISA gas flow formulas
 */
export function calculateNitrogenFlow(inputs: NitrogenFlowInputs): CalculationResult {
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
      massFlowRate: null,
      api520ValveInflow: null,
      reason: 'Calculation error',
      errors: ['Unexpected calculation error'],
      warnings: []
    }
  }
}

function calculateManualFlow(
  inputs: NitrogenFlowInputs,
  errors: string[],
  warnings: string[]
): CalculationResult {
  if (!inputs.manualFlowRate || inputs.manualFlowRate <= 0) {
    errors.push('No manual flow rate entered')
    return {
      calculatedRelievingFlow: null,
      massFlowRate: null,
      api520ValveInflow: null,
      reason: 'No manual flow rate entered',
      errors,
      warnings
    }
  }

  // Convert lb/hr to SCFH: SCFH = (lb/hr / MW) * 379
  const volumetricFlow = (inputs.manualFlowRate / NITROGEN_CONSTANTS.molecularWeight) * UNIT_CONSTANTS.scfhConversion
  
  return {
    calculatedRelievingFlow: Math.round(volumetricFlow),
    massFlowRate: Math.round(inputs.manualFlowRate),
    api520ValveInflow: Math.round(volumetricFlow),
    reason: null,
    errors,
    warnings,
    flowRegime: 'Manual Input',
    equationPath: 'manual'
  }
}

function calculatePressureBasedFlow(
  inputs: NitrogenFlowInputs,
  errors: string[],
  warnings: string[]
): CalculationResult {
  const { totalCv, inletPressure, outletPressure } = inputs
  
  // Validation
  if (!totalCv || totalCv <= 0) {
    errors.push('Total Cv must be greater than 0')
  }
  if (!inletPressure || inletPressure < 0) {
    errors.push('Inlet pressure must be non-negative')
  }
  if (!outletPressure || outletPressure < 0) {
    errors.push('Outlet pressure must be non-negative')
  }
  
  if (errors.length > 0) {
    return {
      calculatedRelievingFlow: null,
      massFlowRate: null,
      api520ValveInflow: null,
      reason: 'Missing or invalid pressure calculation inputs',
      errors,
      warnings
    }
  }

  // Use user inputs or fall back to constants
  const temperatureF = inputs.temperatureF ?? NITROGEN_CONSTANTS.temperatureF
  const compressibilityZ = inputs.compressibilityZ ?? NITROGEN_CONSTANTS.compressibilityZ
  const xt = inputs.xt ?? NITROGEN_CONSTANTS.xt
  const specificGravity = NITROGEN_CONSTANTS.specificGravity

  // Convert to absolute pressures
  const P1 = inletPressure! + UNIT_CONSTANTS.pressureOffset
  const P2 = outletPressure! + UNIT_CONSTANTS.pressureOffset
  
  if (P2 >= P1) {
    errors.push('No forward pressure drop (outlet pressure ≥ inlet pressure)')
    return {
      calculatedRelievingFlow: 0,
      massFlowRate: 0,
      api520ValveInflow: 0,
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
    Q_volumetric = UNIT_CONSTANTS.isaConstant * totalCv! * xt * P1 / Math.sqrt(G * T_abs * Z)
  } else {
    // Non-choked flow: Q = C * Cv * Y * P1 * sqrt(x / (G * T * Z))
    const Y = Math.max(2/3, 1 - x / (3 * xt))
    Q_volumetric = UNIT_CONSTANTS.isaConstant * totalCv! * Y * P1 * Math.sqrt(x / (G * T_abs * Z))
  }

  // Convert to mass flow: lb/hr = (SCFH / 379) * MW
  const massFlowRate = (Q_volumetric / UNIT_CONSTANTS.scfhConversion) * NITROGEN_CONSTANTS.molecularWeight

  return {
    calculatedRelievingFlow: Math.round(Q_volumetric),
    massFlowRate: Math.round(massFlowRate),
    api520ValveInflow: Math.round(Q_volumetric),
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
export function validateInputs(inputs: NitrogenFlowInputs): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (inputs.totalCv !== undefined && inputs.totalCv < 0) {
    errors.push('Total Cv cannot be negative')
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
