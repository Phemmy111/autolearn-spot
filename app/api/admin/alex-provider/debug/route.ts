import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'

export async function GET() {
  try {
    await requireSuperAdmin()

    const key = process.env.ALEX_PROVIDER_ENCRYPTION_KEY
    const keyStatus = {
      exists: !!key,
      length: key?.length || 0,
      isBase64: key ? /^[A-Za-z0-9+/]+=*$/.test(key) : false,
      firstChars: key ? key.substring(0, 4) + '...' : 'none',
    }

    // Try to validate key length
    let decodedLength = 0
    let validationError = null

    if (key) {
      try {
        const decoded = Buffer.from(key, 'base64')
        decodedLength = decoded.length
        if (decodedLength !== 32) {
          validationError = `Key length is ${decodedLength} bytes, must be 32 bytes`
        }
      } catch (e) {
        validationError = 'Key is not valid base64'
      }
    }

    return NextResponse.json({
      encryptionKey: {
        ...keyStatus,
        decodedLength,
        validationError,
        isValid: keyStatus.exists && decodedLength === 32 && !validationError,
      },
      message: keyStatus.exists && decodedLength === 32 
        ? 'Encryption key is properly configured' 
        : 'Encryption key needs configuration',
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Debug endpoint error' }, { status: 500 })
  }
}
