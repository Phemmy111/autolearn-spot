import { PDFDocument } from 'pdf-lib'
import { ImageResponse } from 'next/og'
import React from 'react'
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate'
import { getPublicSettings } from '@/lib/public-settings'

// Function to generate the PNG using next/og
export async function generateCertificatePNG(name: string, date: string, logoUrl?: string): Promise<Uint8Array> {
  // Fetch certificate settings
  const settings = await getPublicSettings([
    'certificate_background_url',
    'certificate_logo_url',
    'certificate_title',
    'certificate_subtitle',
    'certificate_body_text',
    'certificate_founder_name',
    'certificate_signature_url',
    'certificate_signature_text',
    'certificate_qr_enabled',
    'certificate_qr_destination',
    'certificate_footer',
    'certificate_accent_color',
  ])

  const imageResponse = new ImageResponse(
    (
      <CertificateTemplate 
        name={name} 
        date={date} 
        logoSrc={logoUrl || settings.certificateLogoUrl}
        backgroundSrc={settings.certificateBackgroundUrl}
        title={settings.certificateTitle}
        subtitle={settings.certificateSubtitle}
        bodyText={settings.certificateBodyText}
        founderName={settings.certificateFounderName}
        signatureUrl={settings.certificateSignatureUrl}
        signatureText={settings.certificateSignatureText}
        qrEnabled={settings.certificateQrEnabled === 'true'}
        qrDestination={settings.certificateQrDestination}
        footer={settings.certificateFooter}
        accentColor={settings.certificateAccentColor}
      />
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
