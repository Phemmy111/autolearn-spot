export const runtime = 'edge';
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
      // Disable caching to always generate fresh certificate
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
      },
    }
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Function to generate PDF using pdf-lib (always embed PNG)
export async function generateCertificatePDF(name: string, date: string, logoUrl?: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1200, 800]);

  // Embed PNG generated from the template
  const pngBuffer = await generateCertificatePNG(name, date, logoUrl);
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
