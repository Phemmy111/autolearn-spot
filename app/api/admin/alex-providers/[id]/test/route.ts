import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { AIEngine } from '@/lib/alex/ai-engine'

// POST - Super Admin only: Test provider connection
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

    // Test the provider
    const result = await providerManager.testProvider(id)

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error testing ALEX provider:', error)
    return NextResponse.json({ success: false, error: error.message || 'Test failed' }, { status: 500 })
  }
}
