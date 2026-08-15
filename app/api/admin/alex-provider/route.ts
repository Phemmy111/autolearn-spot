import { NextRequest, NextResponse } from 'next/server'
import { AlexProviderManager } from '@/lib/alex/alex-provider'
import { currentUser } from '@clerk/nextjs/server'

// GET /api/admin/alex-provider - Get current ALEX provider configuration
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    // You may want to add admin verification here
    const provider = await AlexProviderManager.getActiveProvider()
    
    // Don't return the actual API key for security
    if (provider) {
      const { api_key_encrypted, ...safeProvider } = provider
      return NextResponse.json({ provider: safeProvider })
    }

    return NextResponse.json({ provider: null })
  } catch (error) {
    console.error('Error in GET /api/admin/alex-provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/alex-provider - Create/update ALEX provider configuration
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    // You may want to add admin verification here

    const body = await request.json()
    const { provider_name, provider_type, api_key, base_url, cost_controls } = body

    if (!provider_name || !provider_type || !api_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const provider = await AlexProviderManager.upsertProvider({
      provider_name,
      provider_type,
      api_key,
      base_url,
      cost_controls,
    })

    if (!provider) {
      return NextResponse.json({ error: 'Failed to save provider configuration' }, { status: 500 })
    }

    // Don't return the actual API key for security
    const { api_key_encrypted, ...safeProvider } = provider
    return NextResponse.json({ provider: safeProvider })
  } catch (error) {
    console.error('Error in POST /api/admin/alex-provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}