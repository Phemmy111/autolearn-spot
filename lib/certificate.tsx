import { PDFDocument } from 'pdf-lib'
import { ImageResponse } from 'next/og'
import React from 'react'
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate'

// Function to generate the PNG using next/og
export async function generateCertificatePNG(name: string, date: string, logoUrl?: string): Promise<Uint8Array> {
  const imageResponse = new ImageResponse(
    (
      <CertificateTemplate name={name} date={date} logoUrl={logoUrl} />
    ),
    {
      width: 1200,
      height: 800,
    }
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Function to generate PDF using pdf-lib (embed PNG from template)
export async function generateCertificatePDF(name: string, date: string, logoUrl?: string): Promise<Uint8Array> {
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
  return new Uint8Array(pdfBytes);
}
