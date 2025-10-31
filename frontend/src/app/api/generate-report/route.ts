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

    // Create the PDF document - ReportPDF returns a Document element
    // Using type assertion to satisfy renderToStream's type requirements
    const pdfElement = createElement(ReportPDF, {
      data: {
        vesselData,
        selectedCaseResults,
        designBasisFlow,
      },
    }) as Parameters<typeof renderToStream>[0]

    // Render to stream
    const stream = await renderToStream(pdfElement)

    // Convert stream to buffer
    // Chunks can be strings or Buffers, convert all to Buffer
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk, 'utf-8'))
      } else if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk)
      } else {
        chunks.push(Buffer.from(chunk))
      }
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

