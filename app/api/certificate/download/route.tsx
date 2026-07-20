

import { generateCertificatePNG, generateCertificatePDF } from '@/lib/certificate'
import { auth, currentUser } from '@clerk/nextjs/server'
import { isSuperAdmin } from '@/lib/admin'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf' // 'pdf' | 'png' | 'svg'
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
    const logoUrl = `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}/favicon.ico`

    let buffer: Buffer
    let contentType: string
    let extension: string

    if (format === 'png') {
      buffer = await generateCertificatePNG(userName, dateStr, logoUrl)
      contentType = 'image/png'
      extension = 'png'
    } else {
      // Default to PDF
      buffer = await generateCertificatePDF(userName, dateStr, logoUrl)
      contentType = 'application/pdf'
      extension = 'pdf'
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="AutoLearn-Certificate.${extension}"`
      }
    })
  } catch (error) {
    console.error('Failed to generate certificate:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
