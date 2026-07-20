import { ImageResponse } from 'next/og'
import { PDFDocument } from 'pdf-lib'
import React from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/admin'
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate'
import fs from 'fs'
import path from 'path'
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

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Fetch font for the cursive name
    const fontRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/great-vibes@latest/latin-400-normal.ttf')
    const fontData = await fontRes.arrayBuffer()
    
    // Fetch a standard font (Roboto) for the rest of the text
    const robotoRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.ttf')
    const robotoData = await robotoRes.arrayBuffer()

    // Generate QR Code linking to verification URL
    const verifyUrl = `${request.headers.get('origin') || 'https://autolearnspot.com'}/certificate/verify?id=${userId}`
    const qrCodeSrc = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // Load logo from public directory
    let logoSrc = undefined;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      const logoData = fs.readFileSync(logoPath)
      logoSrc = `data:image/png;base64,${logoData.toString('base64')}`
    } catch (err) {
      console.warn('Could not load logo.png from public directory', err)
    }

    // Generate the certificate PNG using ImageResponse (satori)
    const imageResponse = new ImageResponse(
      (<CertificateTemplate name={userName} date={dateStr} logoSrc={logoSrc} qrCodeSrc={qrCodeSrc} />),
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
