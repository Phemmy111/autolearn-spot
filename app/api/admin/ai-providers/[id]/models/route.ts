import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { AIProviderManager } from '@/lib/ai-provider'

// POST - Super Admin only: Fetch models from provider
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const models = await AIProviderManager.fetchModels(params.id)

    return NextResponse.json({ models })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
