import { generateCertificatePNG, generateCertificatePDF } from '@/lib/certificate';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin';

// Force Node.js runtime (pdf-lib requires Buffer)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf' // 'pdf' | 'png'
    const studentNameParam = searchParams.get('name')
    
    const user = await currentUser()
    let userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.username || 'Student'
      
    // Allow super admin to override the name
    if (studentNameParam) {
      const isSuper = await isSuperAdmin()
      if (isSuper) {
        userName = studentNameParam
      }
    }
      
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const logoUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/favicon.ico`

    let data: Uint8Array
    let contentType: string
    let extension: string

    if (format === 'png') {
      data = await generateCertificatePNG(userName, dateStr, logoUrl)
      contentType = 'image/png'
      extension = 'png'
    } else {
      // Default to PDF
      data = await generateCertificatePDF(userName, dateStr, logoUrl)
      contentType = 'application/pdf'
      extension = 'pdf'
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="AutoLearn-Certificate.${extension}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
  } catch (error) {
    console.error('Failed to generate certificate:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 })
  }
}
