import { useVessel } from '../context/VesselContext'
import { useCase } from '../context/CaseContext'
import { useState } from 'react'

// Helper to capitalize text properly
const formatTextValue = (value: string | undefined | null): string => {
  if (!value) return 'N/A'
  
  // Handle specific known values
  const valueMap: Record<string, string> = {
    'horizontal': 'Horizontal',
    'vertical': 'Vertical',
    'sphere': 'Sphere',
    'above-grade': 'Above Grade',
    'earth-covered': 'Earth Covered',
    'below-grade': 'Below Grade',
  }
  
  const lowerValue = value.toLowerCase()
  if (valueMap[lowerValue]) {
    return valueMap[lowerValue]
  }
  
  return value
}

// Case-specific data extraction functions
const extractExternalFireData = () => {
  const flowDataStr = localStorage.getItem('external-fire-flow-data')
  const pressureDataStr = localStorage.getItem('external-fire-pressure-data')
  
  if (!flowDataStr) return null
  
  const flow = JSON.parse(flowDataStr)
  const pressure = pressureDataStr ? JSON.parse(pressureDataStr) : {}
  
  return {
    inputData: {
      'Applicable Fire Code': flow.applicableFireCode || 'N/A',
      'Adequate Drainage/Firefighting': flow.hasAdequateDrainageFirefighting ? 'Yes' : 'No',
      'Storage Type': formatTextValue(flow.storageType),
      'Has Insulation': flow.hasInsulation ? 'Yes' : 'No',
      'Insulation Material': flow.insulationMaterial || 'None',
      'Insulation Thickness (inches)': flow.insulationThickness || 'N/A',
      'Process Temperature (°F)': flow.processTemperature || 'N/A',
      'Relieving Temperature (°F)': flow.relievingTemperature || 'N/A',
    },
    outputData: {
      'Wetted Surface Area (ft²)': typeof flow.wettedSurfaceArea === 'number' ? flow.wettedSurfaceArea.toFixed(2) : 'N/A',
      'Heat Input (Btu/hr)': typeof flow.heatInput === 'number' ? flow.heatInput.toLocaleString() : 'N/A',
      'Environmental Factor': typeof flow.environmentalFactor === 'number' ? flow.environmentalFactor.toFixed(3) : 'N/A',
      'Calculated Relieving Flow (lb/hr)': typeof flow.calculatedRelievingFlow === 'number' ? flow.calculatedRelievingFlow.toLocaleString() : 'N/A',
      'ASME VIII Design Flow (lb/hr)': typeof flow.asmeVIIIDesignFlow === 'number' ? flow.asmeVIIIDesignFlow.toLocaleString() : 'N/A',
      'Max Allowed Venting Pressure (psig)': typeof pressure.maxAllowedVentingPressure === 'number' ? pressure.maxAllowedVentingPressure.toFixed(2) : 'N/A',
      'Max Allowable Backpressure (psig)': typeof pressure.maxAllowableBackpressure === 'number' ? pressure.maxAllowableBackpressure.toFixed(2) : 'N/A',
    },
  }
}

const extractControlValveFailureData = () => {
  const flowDataStr = localStorage.getItem('control-valve-failure-flow-data')
  const pressureDataStr = localStorage.getItem('control-valve-failure-pressure-data')
  
  if (!flowDataStr) return null
  
  const flow = JSON.parse(flowDataStr)
  const pressure = pressureDataStr ? JSON.parse(pressureDataStr) : {}
  
  // Get gas properties
  const gasName = flow.gasProperties?.name || flow.selectedGas || 'Nitrogen (N₂)'
  const molWeight = flow.gasProperties?.molecularWeight || 28.0134
  const specGravity = flow.gasProperties?.specificGravity || 0.967
  
  return {
    inputData: {
      'Gas Type': gasName,
      'Molecular Weight (lb/lbmol)': typeof molWeight === 'number' ? molWeight.toFixed(2) : 'N/A',
      'Specific Gravity': typeof specGravity === 'number' ? specGravity.toFixed(3) : 'N/A',
      'Control Valve Cv': typeof flow.totalCv === 'number' ? flow.totalCv : 'N/A',
      'Bypass Valve Included': flow.considerBypass ? 'Yes' : 'No',
      ...(flow.considerBypass && flow.bypassCv ? { 'Bypass Valve Cv': flow.bypassCv } : {}),
      ...(flow.effectiveCv ? { 'Effective Total Cv': flow.effectiveCv.toFixed(1) } : {}),
      'Inlet Pressure (psig)': typeof flow.inletPressure === 'number' ? flow.inletPressure : 'N/A',
      'Outlet Pressure (psig)': typeof flow.outletPressure === 'number' ? flow.outletPressure : 'N/A',
      'Temperature (°F)': typeof flow.temperatureF === 'number' ? flow.temperatureF : 'N/A',
      'Compressibility (Z)': typeof flow.compressibilityZ === 'number' ? flow.compressibilityZ : 'N/A',
      'Pressure Drop Ratio (xt)': typeof flow.xt === 'number' ? flow.xt : 'N/A',
      'Outlet Flow Credit Applied': flow.creditOutletFlow ? 'Yes' : 'No',
      ...(flow.creditOutletFlow && flow.outletFlowCredit ? { 'Normal Outlet Flow (SCFH)': flow.outletFlowCredit.toLocaleString() } : {}),
    },
    outputData: {
      'Gross Inlet Flow (SCFH)': typeof flow.calculatedRelievingFlow === 'number' ? flow.calculatedRelievingFlow.toLocaleString() : 'N/A',
      ...(flow.netRelievingFlow && flow.creditOutletFlow ? { 'Net Relief Flow (SCFH)': flow.netRelievingFlow.toLocaleString() } : {}),
      ...(flow.outletCreditApplied && flow.creditOutletFlow ? { 'Outlet Credit Applied (SCFH)': flow.outletCreditApplied.toLocaleString() } : {}),
      'Mass Flow Rate (lb/hr)': typeof flow.massFlowRate === 'number' ? flow.massFlowRate.toLocaleString() : 'N/A',
      'ASME VIII Design Flow (lb/hr)': typeof flow.asmeVIIIDesignFlow === 'number' ? flow.asmeVIIIDesignFlow.toLocaleString() : 'N/A',
      'Max Allowed Venting Pressure (psig)': typeof pressure.maxAllowedVentingPressure === 'number' ? pressure.maxAllowedVentingPressure.toFixed(2) : 'N/A',
      'Max Allowable Backpressure (psig)': typeof pressure.maxAllowableBackpressure === 'number' ? pressure.maxAllowableBackpressure.toFixed(2) : 'N/A',
    },
  }
}

const extractLiquidOverfillData = () => {
  const flowDataStr = localStorage.getItem('liquid-overfill-flow-data')
  const pressureDataStr = localStorage.getItem('liquid-overfill-pressure-data')
  
  if (!flowDataStr) return null
  
  const flow = JSON.parse(flowDataStr)
  const pressure = pressureDataStr ? JSON.parse(pressureDataStr) : {}
  
  return {
    inputData: {
      'Manual Flow Rate (lb/hr)': typeof flow.manualFlowRate === 'number' ? flow.manualFlowRate.toLocaleString() : 'N/A',
    },
    outputData: {
      'Calculated Relieving Flow (lb/hr)': typeof flow.manualFlowRate === 'number' ? flow.manualFlowRate.toLocaleString() : 'N/A',
      'ASME VIII Design Flow (lb/hr)': typeof flow.manualFlowRate === 'number' ? Math.round(flow.manualFlowRate / 0.9).toLocaleString() : 'N/A',
      'Max Allowed Venting Pressure (psig)': typeof pressure.maxAllowedVentingPressure === 'number' ? pressure.maxAllowedVentingPressure.toFixed(2) : 'N/A',
      'Max Allowable Backpressure (psig)': typeof pressure.maxAllowableBackpressure === 'number' ? pressure.maxAllowableBackpressure.toFixed(2) : 'N/A',
    },
  }
}

export const useReportGenerator = () => {
  const { vesselData } = useVessel()
  const { selectedCases, caseResults, getDesignBasisFlow } = useCase()
  const [isGenerating, setIsGenerating] = useState(false)

  const generateReport = async () => {
    setIsGenerating(true)
    
    try {
      // Collect data for all selected cases
      const selectedCaseResults = []
      
      if (selectedCases['external-fire'] && caseResults['external-fire'].isCalculated) {
        const data = extractExternalFireData()
        if (data) {
          selectedCaseResults.push({
            caseId: 'external-fire',
            caseName: 'Case 1 - External Fire',
            ...data,
          })
        }
      }
      
      if (selectedCases['control-valve-failure'] && caseResults['control-valve-failure'].isCalculated) {
        const data = extractControlValveFailureData()
        if (data) {
          selectedCaseResults.push({
            caseId: 'control-valve-failure',
            caseName: 'Case 2 - Control Valve Failure (Gas Service)',
            ...data,
          })
        }
      }
      
      if (selectedCases['liquid-overfill'] && caseResults['liquid-overfill'].isCalculated) {
        const data = extractLiquidOverfillData()
        if (data) {
          selectedCaseResults.push({
            caseId: 'liquid-overfill',
            caseName: 'Case 3 - Liquid Overfill',
            ...data,
          })
        }
      }
      
      // Check if we have any data to report
      if (selectedCaseResults.length === 0) {
        alert('No calculated cases to include in report. Please complete at least one case calculation.')
        setIsGenerating(false)
        return
      }
      
      // Get design basis flow and add SCFH conversion
      const designBasisFlowRaw = getDesignBasisFlow()
      const designBasisFlow = designBasisFlowRaw ? {
        ...designBasisFlowRaw,
        // Convert lb/hr to SCFH (assuming air at standard conditions: 0.0752 lb/ft³)
        flowSCFH: Math.round(designBasisFlowRaw.flow / 0.0752)
      } : null
      
      // Format vessel data for display
      const formattedVesselData = {
        ...vesselData,
        vesselOrientation: formatTextValue(vesselData.vesselOrientation || 'vertical')
      }
      
      // Prepare data for API
      const reportData = {
        vesselData: formattedVesselData,
        selectedCaseResults,
        designBasisFlow,
      }
      
      // Call API to generate PDF
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }
      
      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reliefguard_report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Report generation error:', error)
      alert(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }
  
  return { generateReport, isGenerating }
}

