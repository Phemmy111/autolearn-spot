import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { AIProviderManager } from '@/lib/ai-provider'

// POST - Super Admin only: Test provider connection
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const result = await AIProviderManager.testProvider(params.id)

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error testing provider:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
