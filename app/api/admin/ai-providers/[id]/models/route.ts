import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { AIProviderManager } from '@/lib/ai-provider'

// POST - Super Admin only: Fetch models from provider
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()

    const { id } = await params
    console.log('Fetching models for provider ID:', id)

    const models = await AIProviderManager.fetchModels(id)

    return NextResponse.json({ models })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
