import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'

export async function GET() {
  try {
    await requireSuperAdmin()

    const key = process.env.ALEX_PROVIDER_ENCRYPTION_KEY
    const keyStatus = {
      exists: !!key,
      length: key?.length || 0,
      message: key ? 'Encryption key configured (using simple padding like quiz system)' : 'Using default encryption key',
    }

    return NextResponse.json({
      encryptionKey: keyStatus,
      message: 'ALEX now uses same encryption approach as quiz system'
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Debug endpoint error' }, { status: 500 })
  }
}
