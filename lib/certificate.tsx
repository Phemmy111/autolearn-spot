import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { ImageResponse } from 'next/og'
import React from 'react'
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate'

// Function to generate the PNG using next/og
export async function generateCertificatePNG(name: string, date: string, logoUrl?: string): Promise<Buffer> {
  const imageResponse = new ImageResponse(
    (
      <CertificateTemplate name={name} date={date} logoUrl={logoUrl} />
    ),
    {
      width: 1200,
      height: 800,
    }
  )

  const arrayBuffer = await imageResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Function to generate PDF using pdf-lib
export async function generateCertificatePDF(name: string, date: string, logoUrl?: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([1200, 800])
  
  // Try to embed PNG first to make PDF look exactly like PNG
  try {
    const pngBuffer = await generateCertificatePNG(name, date, logoUrl)
    const pngImage = await pdfDoc.embedPng(pngBuffer)
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
    })
  } catch (err) {
    console.error('Failed to embed PNG in PDF, falling back to basic text', err)
    
    // Fallback: draw basic text on PDF
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    page.drawRectangle({
      x: 0, y: 0, width: 1200, height: 800,
      color: rgb(12/255, 14/255, 18/255)
    })
    
    page.drawText('Certificate of Completion', {
      x: 300, y: 600, size: 48, font, color: rgb(1, 1, 1)
    })
    
    page.drawText('This certifies that', {
      x: 450, y: 500, size: 24, font: normalFont, color: rgb(0.72, 0.79, 0.79)
    })
    
    page.drawText(name, {
      x: 400, y: 400, size: 64, font, color: rgb(0, 0.94, 1)
    })
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
