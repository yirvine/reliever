import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import ReportPDF from '../../components/ReportPDF'
import { createElement } from 'react'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vesselData, selectedCaseResults, designBasisFlow } = body

    // Validate required data
    if (!vesselData || !selectedCaseResults) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      )
    }

    // Create the PDF document
    const pdfElement = createElement(ReportPDF, {
      data: {
        vesselData,
        selectedCaseResults,
        designBasisFlow,
      },
    })

    // Render to stream
    const stream = await renderToStream(pdfElement)

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Return PDF as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="reliefguard_report.pdf"',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

