/**
 * Shared types for all case pages
 * Avoids duplication across case implementations
 */

export interface CasePressureData {
  maxAllowedVentingPressure: number
  maxAllowableBackpressure: number
  maxAllowedVentingPressurePercent: number
  asmeSetPressure?: number
  manufacturingRangeOverpressure?: number
  burstToleranceOverpressure?: number
}

/**
 * localStorage key constants for case data
 * Prevents typos and enables easy refactoring
 */
export const STORAGE_KEYS = {
  EXTERNAL_FIRE_FLOW: 'external-fire-flow-data',
  EXTERNAL_FIRE_PRESSURE: 'external-fire-pressure-data',
  CONTROL_VALVE_FLOW: 'control-valve-failure-flow-data',
  CONTROL_VALVE_PRESSURE: 'control-valve-failure-pressure-data',
  LIQUID_OVERFILL_FLOW: 'liquid-overfill-flow-data',
  LIQUID_OVERFILL_PRESSURE: 'liquid-overfill-pressure-data',
  BLOCKED_OUTLET_FLOW: 'blocked-outlet-flow-data',
  BLOCKED_OUTLET_PRESSURE: 'blocked-outlet-pressure-data',
  COOLING_REFLUX_FAILURE_FLOW: 'cooling-reflux-failure-flow-data',
  COOLING_REFLUX_FAILURE_PRESSURE: 'cooling-reflux-failure-pressure-data',
} as const

