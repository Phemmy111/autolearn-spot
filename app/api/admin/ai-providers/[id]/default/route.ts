import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { AIProviderManager } from '@/lib/ai-provider'

// POST - Super Admin only: Set provider as default
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()

    const { id } = await params
    console.log('Setting default provider ID:', id)

    const success = await AIProviderManager.setDefaultProvider(id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to set default provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error setting default provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
