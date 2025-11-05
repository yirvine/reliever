import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { VesselData } from '../context/VesselContext'

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
  },
  logo: {
    width: 120,
    height: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  designBasisSection: {
    backgroundColor: '#f8fafc',
    padding: 15,
    marginBottom: 20,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1e3a8a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  designBasisTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  designBasisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  designBasisLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  designBasisValue: {
    fontSize: 11,
    color: '#1e293b',
  },
  vesselSection: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: 6,
  },
  caseSection: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  caseTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    padding: 6,
  },
  twoColumnRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  column: {
    width: '48%',
  },
  parameterRow: {
    marginBottom: 5,
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  resultHighlight: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  resultLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginBottom: 3,
  },
  resultValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
})

interface ReportData {
  vesselData: VesselData
  selectedCaseResults: {
    caseId: string
    caseName: string
    inputData: Record<string, unknown>
    outputData: Record<string, unknown>
  }[]
  designBasisFlow: {
    flow: number
    flowSCFH: number
    caseName: string
  } | null
}

interface ReportPDFProps {
  data: ReportData
}

const formatValue = (value: unknown, unit?: string): string => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'number') {
    return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString()
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const ReportPDF = ({ data }: ReportPDFProps) => {
  const { vesselData, selectedCaseResults, designBasisFlow } = data

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ReliefGuard Report</Text>
          <Text style={{ fontSize: 9, color: '#6b7280' }}>
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Design Basis Flow Section */}
        {designBasisFlow && (
          <View style={styles.designBasisSection}>
            <Text style={styles.designBasisTitle}>Design Basis Flow</Text>
            <View style={styles.designBasisRow}>
              <Text style={styles.designBasisLabel}>Required Relieving Flow:</Text>
              <Text style={styles.designBasisValue}>
                {designBasisFlow.flow.toLocaleString()} lb/hr ({designBasisFlow.flowSCFH.toLocaleString()} SCFH)
              </Text>
            </View>
            <View style={styles.designBasisRow}>
              <Text style={styles.designBasisLabel}>Governing Case:</Text>
              <Text style={styles.designBasisValue}>{designBasisFlow.caseName}</Text>
            </View>
          </View>
        )}

        {/* Vessel Properties */}
        <View style={styles.vesselSection}>
          <Text style={styles.sectionTitle}>Vessel Properties</Text>
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <View style={styles.parameterRow}>
                <Text style={styles.label}>Vessel Tag</Text>
                <Text style={styles.value}>{vesselData.vesselTag || 'N/A'}</Text>
              </View>
              <View style={styles.parameterRow}>
                <Text style={styles.label}>Vessel Diameter</Text>
                <Text style={styles.value}>{formatValue(vesselData.vesselDiameter, 'in')}</Text>
              </View>
              <View style={styles.parameterRow}>
                <Text style={styles.label}>Straight Side Height</Text>
                <Text style={styles.value}>{formatValue(vesselData.straightSideHeight, 'in')}</Text>
              </View>
              <View style={styles.parameterRow}>
                <Text style={styles.label}>Head Type</Text>
                <Text style={styles.value}>{vesselData.headType}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.parameterRow}>
                <Text style={styles.label}>ASME Set Pressure</Text>
                <Text style={styles.value}>{formatValue(vesselData.asmeSetPressure, 'psig')}</Text>
              </View>
              <View style={styles.parameterRow}>
                <Text style={styles.label}>Design MAWP</Text>
                <Text style={styles.value}>{formatValue(vesselData.vesselDesignMawp, 'psig')}</Text>
              </View>
              <View style={styles.parameterRow}>
                <Text style={styles.label}>Vessel Orientation</Text>
                <Text style={styles.value}>{vesselData.vesselOrientation || 'vertical'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Case Results */}
        {selectedCaseResults.map((caseResult) => (
          <View key={caseResult.caseId} style={styles.caseSection}>
            <Text style={styles.caseTitle}>{caseResult.caseName}</Text>
            
            {/* Input Parameters */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#4b5563' }}>
                Input Parameters
              </Text>
              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  {Object.entries(caseResult.inputData)
                    .slice(0, Math.ceil(Object.entries(caseResult.inputData).length / 2))
                    .map(([key, value]) => (
                      <View key={key} style={styles.parameterRow}>
                        <Text style={styles.label}>{key}</Text>
                        <Text style={styles.value}>{formatValue(value)}</Text>
                      </View>
                    ))}
                </View>
                <View style={styles.column}>
                  {Object.entries(caseResult.inputData)
                    .slice(Math.ceil(Object.entries(caseResult.inputData).length / 2))
                    .map(([key, value]) => (
                      <View key={key} style={styles.parameterRow}>
                        <Text style={styles.label}>{key}</Text>
                        <Text style={styles.value}>{formatValue(value)}</Text>
                      </View>
                    ))}
                </View>
              </View>
            </View>

            {/* Output Results */}
            <View style={styles.resultHighlight}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#1e3a8a' }}>
                Calculation Results
              </Text>
              {Object.entries(caseResult.outputData).map(([key, value]) => (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={styles.resultLabel}>{key}:</Text>
                  <Text style={styles.resultValue}>{formatValue(value)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated using NFPA 30, API 521, API 520, and ASME VIII standards.
          </Text>
          <Text style={{ marginTop: 4 }}>
            ReliefGuard Prototype Build ©2025 ReliefGuard
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default ReportPDF

