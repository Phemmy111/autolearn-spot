import { ImageResponse } from 'next/og'
import { PDFDocument } from 'pdf-lib'
import React from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate'
import { getPublicSettings } from '@/lib/public-settings'
import { supabaseAdmin } from '@/lib/supabase'
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
    const targetUserIdParam = searchParams.get('userId')
    const certificateIdParam = searchParams.get('certificateId')
    const cohortIdParam = searchParams.get('cohortId')
    const productIdParam = searchParams.get('productId')
    const courseParam = searchParams.get('course')

    const user = await currentUser()
    const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    const currentUserName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.username || ''

    let userName = ''
    let courseTitle = ''
    let certificateCode = ''

    // 1. If certificateId is given, fetch certificate record directly
    let certificateRecord: any = null
    if (certificateIdParam && !certificateIdParam.startsWith('pending-')) {
      const { data } = await supabaseAdmin
        .from('certificates')
        .select('*, cohorts(name, learning_products(title))')
        .eq('id', certificateIdParam)
        .limit(1)
      certificateRecord = data?.[0]
    }

    // 2. If certificate record found
    if (certificateRecord) {
      userName = certificateRecord.user_name || ''
      courseTitle = certificateRecord.course_title || ''
      certificateCode = certificateRecord.certificate_code || ''

      if (!courseTitle && certificateRecord.learning_product_id) {
        const { data: lp } = await supabaseAdmin
          .from('learning_products')
          .select('title')
          .eq('id', certificateRecord.learning_product_id)
          .limit(1)
        if (lp?.[0]?.title) courseTitle = lp[0].title
      }
    }

    // 3. If targetUserIdParam is provided or certificate search by user
    if (!userName && targetUserIdParam) {
      const { data: targetCert } = await supabaseAdmin
        .from('certificates')
        .select('user_name, course_title, certificate_code')
        .eq('user_id', targetUserIdParam)
        .order('issued_at', { ascending: false })
        .limit(1)
      if (targetCert?.[0]) {
        userName = targetCert[0].user_name
        if (!courseTitle) courseTitle = targetCert[0].course_title
        if (!certificateCode) certificateCode = targetCert[0].certificate_code
      }

      if (!userName) {
        const { data: enroll } = await supabaseAdmin
          .from('enrollments')
          .select('full_name, learning_products(title)')
          .or(`clerk_user_id.eq.${targetUserIdParam},user_id.eq.${targetUserIdParam}`)
          .limit(1)
        if (enroll?.[0]?.full_name) userName = enroll[0].full_name
        if (!courseTitle && (enroll?.[0] as any)?.learning_products?.title) {
          courseTitle = (enroll?.[0] as any).learning_products.title
        }
      }
    }

    // 4. Honor explicit query parameters (from admin tables, certificates grid, or custom URLs)
    if (studentNameParam && studentNameParam.trim()) {
      userName = studentNameParam.trim()
    }
    if (courseParam && courseParam.trim()) {
      courseTitle = courseParam.trim()
    }

    // 5. If still no user name, check logged-in user's enrollment
    if (!userName && userEmail) {
      const { data: myEnrollment } = await supabaseAdmin
        .from('enrollments')
        .select('full_name, learning_products(title)')
        .eq('email', userEmail)
        .order('enrolled_at', { ascending: false })
        .limit(1)
      if (myEnrollment?.[0]?.full_name) {
        userName = myEnrollment[0].full_name
        if (!courseTitle && (myEnrollment[0] as any)?.learning_products?.title) {
          courseTitle = (myEnrollment[0] as any).learning_products.title
        }
      }
    }

    // 6. If productIdParam or cohortIdParam provided and courseTitle still unknown
    if (!courseTitle && productIdParam) {
      const { data: lp } = await supabaseAdmin
        .from('learning_products')
        .select('title')
        .eq('id', productIdParam)
        .limit(1)
      if (lp?.[0]?.title) courseTitle = lp[0].title
    }
    if (!courseTitle && cohortIdParam) {
      const { data: ch } = await supabaseAdmin
        .from('cohorts')
        .select('name, learning_products(title)')
        .eq('id', cohortIdParam)
        .limit(1)
      if (ch?.[0]) {
        const lpObj = ch[0].learning_products
        const lpTitle = Array.isArray(lpObj) ? lpObj[0]?.title : (lpObj as any)?.title
        courseTitle = lpTitle || ch[0].name
      }
    }

    // 7. Ultimate fallbacks
    if (!userName) userName = currentUserName || 'Student'
    if (!courseTitle) courseTitle = 'AI Automation with n8n'
    if (!certificateCode) {
      certificateCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    }

    // Capitalize first letters of each name word
    userName = userName
      .split(' ')
      .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
      .join(' ')

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const baseUrl = new URL('/', request.url).toString().slice(0, -1)

    // Certificate settings
    const certSettings = await getPublicSettings([
      'certificateSignatureUrl',
      'certificateAccentColor',
      'certificateQrEnabled',
      'certificateQrDestination',
      'certificateFooter'
    ])

    const accentColor = certSettings.certificateAccentColor || '#00f0ff'
    const qrEnabled = certSettings.certificateQrEnabled !== 'false'
    const qrDestination = certSettings.certificateQrDestination || `${baseUrl}/certificate/verify`

    // Generate QR code
    let qrData = null
    if (qrEnabled) {
      const verifyUrl = `${qrDestination}?name=${encodeURIComponent(userName)}&code=${encodeURIComponent(certificateCode)}`
      const qrCodeData = QRCode.create(verifyUrl)
      qrData = { modules: { size: qrCodeData.modules.size, data: Array.from(qrCodeData.modules.data).map(byte => byte === 1) } }
    }

    // Font data
    const fontRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-600-normal.ttf')
    const fontData = await fontRes.arrayBuffer()
    const robotoRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.ttf')
    const robotoData = await robotoRes.arrayBuffer()

    const absoluteBackgroundSrc = `${baseUrl}/certificate-template.png`

    const imageResponse = new ImageResponse(
      (
        <CertificateTemplate
          name={userName}
          date={dateStr}
          course={courseTitle}
          certificateId={certificateCode}
          qrData={qrData}
          backgroundSrc={absoluteBackgroundSrc}
          signatureUrl={certSettings.certificateSignatureUrl || ''}
          footer={certSettings.certificateFooter || ''}
          accentColor={accentColor}
        />
      ),
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
            name: 'Playfair Display',
            data: fontData,
            style: 'normal',
            weight: 600
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
          'Content-Disposition': `attachment; filename="AutoLearn-Certificate-${certificateCode}.png"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      })
    }

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
        'Content-Disposition': `attachment; filename="AutoLearn-Certificate-${certificateCode}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  } catch (error) {
    console.error('Failed to generate certificate:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 })
  }
}
