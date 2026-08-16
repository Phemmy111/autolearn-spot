import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { AIEngine } from '@/lib/alex/ai-engine'

// POST - Super Admin only: Fetch models from provider
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const { id } = params

    // Get provider manager and reload providers from database
    const providerManager = AIEngine.getProviderManager()
    await providerManager.loadProviders()

    // Refresh models
    const models = await providerManager.refreshModels(id)

    return NextResponse.json({ models })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error fetching ALEX provider models:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch models' }, { status: 500 })
  }
}
