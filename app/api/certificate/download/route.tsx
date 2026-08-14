import { ImageResponse } from 'next/og'
import { PDFDocument } from 'pdf-lib'
import React from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/admin'
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate'
import { getPublicSettings } from '@/lib/public-settings'
import { supabaseAdmin } from '@/lib/supabase'
import { CertificateLayout, validateLayout, DEFAULT_CERTIFICATE_LAYOUT } from '@/lib/certificate-layout'
import QRCode from 'qrcode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'
    const studentNameParam = searchParams.get('name')

    const user = await currentUser()
    let userName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.username || 'Student'

    // Allow super admin to override the name
    if (studentNameParam) {
      const isSuper = await isSuperAdmin()
      if (isSuper) {
        userName = studentNameParam
      }
    }

    // Capitalize the first letter of each word robustly
    userName = userName
      .split(' ')
      .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
      .join(' ')

    const baseUrl = new URL('/', request.url).toString().slice(0, -1) // e.g. https://domain.com

    // Fetch the certificate record to get the actual certificate code
    const { data: certificateRecord } = await supabaseAdmin
      .from('certificates')
      .select('certificate_code')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false })
      .limit(1)
      .single()

    const certificateId = certificateRecord?.certificate_code || ''

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Fetch certificate settings from database
    const certSettings = await getPublicSettings([
      'certificate_background_url',
      'certificate_logo_url',
      'certificate_title',
      'certificate_subtitle',
      'certificate_body_text',
      'certificate_course',
      'certificate_founder_name',
      'certificate_signature_url',
      'certificate_signature_text',
      'certificate_qr_enabled',
      'certificate_qr_destination',
      'certificate_footer',
      'certificate_accent_color',
      'certificate_layout',
    ])

    // Use database settings with fallbacks to hardcoded values
    // Use the new professional certificate background
    const backgroundSrc = certSettings.certificate_background_url || `${baseUrl}/certificate-template.png`
    const logoSrc = certSettings.certificate_logo_url || `${baseUrl}/logo.png`
    const title = certSettings.certificate_title || 'Certificate of Completion'
    const subtitle = certSettings.certificate_subtitle || 'This certifies that'
    const bodyText = certSettings.certificate_body_text || 'has successfully completed the'
    const course = certSettings.certificate_course || 'n8n Automation'
    const founderName = certSettings.certificate_founder_name || 'AutoLearn Spot'
    const signatureUrl = certSettings.certificate_signature_url || ''
    const signatureText = certSettings.certificate_signature_text || 'Founder'
    const footer = certSettings.certificate_footer || 'AutoLearn Spot - AI Automation Training'
    const accentColor = certSettings.certificate_accent_color || '#00f0ff'
    const qrEnabled = certSettings.certificate_qr_enabled !== 'false'
    const qrDestination = certSettings.certificate_qr_destination || `${baseUrl}/certificate/verify`

    // Fetch font for the cursive name
    const fontRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/great-vibes@latest/latin-400-normal.ttf')
    const fontData = await fontRes.arrayBuffer()
    
    // Fetch a standard font (Roboto) for the rest of the text
    const robotoRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.ttf')
    const robotoData = await robotoRes.arrayBuffer()

    // Generate QR code only if enabled
    let qrData = null
    if (qrEnabled) {
      const verifyUrl = `${qrDestination}?name=${encodeURIComponent(userName)}&date=${encodeURIComponent(dateStr)}`
      const qrCodeData = QRCode.create(verifyUrl)
      qrData = { modules: { size: qrCodeData.modules.size, data: Array.from(qrCodeData.modules.data).map(byte => byte === 1) } }
    }

    // Load and validate layout
    let certificateLayout: CertificateLayout = DEFAULT_CERTIFICATE_LAYOUT
    if (certSettings.certificate_layout) {
      try {
        const parsedLayout = JSON.parse(certSettings.certificate_layout)
        console.log('Loaded layout from settings:', JSON.stringify(parsedLayout, null, 2))
        const validation = validateLayout(parsedLayout)
        console.log('Layout validation:', validation)
        if (validation.valid) {
          certificateLayout = parsedLayout
        } else {
          console.error('Invalid certificate layout in settings:', validation.errors)
          console.log('Falling back to default layout')
        }
      } catch (e) {
        console.error('Failed to parse certificate layout:', e)
        console.log('Raw layout value:', certSettings.certificate_layout)
      }
    } else {
      console.log('No certificate_layout found in settings, using default')
    }

    // Use absolute URL for the background and logo so next/og can fetch them
    let absoluteLogoSrc = ''
    if (logoSrc) {
      absoluteLogoSrc = logoSrc.startsWith('http') ? logoSrc : `${baseUrl}${logoSrc}`
    }
    
    let absoluteBackgroundSrc = ''
    if (backgroundSrc) {
      absoluteBackgroundSrc = backgroundSrc.startsWith('http') ? backgroundSrc : `${baseUrl}${backgroundSrc}`
    }

    // Generate the certificate PNG using ImageResponse (satori)
    const imageResponse = new ImageResponse(
      (<CertificateTemplate 
        layout={certificateLayout}
        name={userName} 
        date={dateStr} 
        course={course}
        certificateId={certificateId}
        logoSrc={absoluteLogoSrc} 
        qrData={qrData} 
        backgroundSrc={absoluteBackgroundSrc}
        title={title}
        subtitle={subtitle}
        bodyText={bodyText}
        founderName={founderName}
        signatureUrl={signatureUrl}
        signatureText={signatureText}
        qrEnabled={qrEnabled}
        qrDestination={qrDestination}
        footer={footer}
        accentColor={accentColor}
      />),
      { 
        width: 1200, 
        height: 800,
        fonts: [
          {
            name: 'Roboto',
            data: robotoData,
            style: 'normal',
            weight: 400
          },
          {
            name: 'GreatVibes',
            data: fontData,
            style: 'normal',
            weight: 400
          }
        ]
      }
    )

    if (format === 'png') {
      const pngData = await imageResponse.arrayBuffer()
      return new Response(pngData, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="AutoLearn-Certificate.png"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      })
    }

    // PDF: embed the PNG into a single-page PDF
    const pngArrayBuffer = await imageResponse.arrayBuffer()
    const pngUint8 = new Uint8Array(pngArrayBuffer)

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([1200, 800])
    const pngImage = await pdfDoc.embedPng(pngUint8)
    page.drawImage(pngImage, { x: 0, y: 0, width: 1200, height: 800 })
    const pdfBytes = await pdfDoc.save()

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AutoLearn-Certificate.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  } catch (error) {
    console.error('Failed to generate certificate:', error)
    
    // Get the Vercel request ID for easier debugging
    const requestId = request.headers.get('x-vercel-id') || 'unknown';

    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error), requestId },
      { 
        status: 500,
        headers: { 'x-vercel-request-id': requestId } 
      }
    )
  }
}
