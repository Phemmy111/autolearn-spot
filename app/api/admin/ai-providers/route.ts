import { NextResponse } from 'next/server'
import { requireSuperAdmin, currentUser } from '@/lib/admin'
import { AIProviderManager, ProviderConfig } from '@/lib/ai-provider'

// GET - Super Admin only: Get all AI providers
export async function GET() {
  try {
    await requireSuperAdmin()

    const providers = await AIProviderManager.getActiveProviders()

    return NextResponse.json({ providers })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching providers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Super Admin only: Create new AI provider
export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { name, provider_type, api_key, base_url, default_model } = body

    // Validate required fields
    if (!name || !provider_type || !api_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTypes = ['openrouter', 'openai', 'gemini', 'groq']
    if (!validTypes.includes(provider_type)) {
      return NextResponse.json({ error: 'Invalid provider type' }, { status: 400 })
    }

    // Get current user info
    const user = await currentUser()
    const createdBy = user?.id

    const config: ProviderConfig = {
      name,
      provider_type,
      api_key,
      base_url,
      default_model,
    }

    const provider = await AIProviderManager.createProvider(config, createdBy || '')

    if (!provider) {
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
    }

    return NextResponse.json({ provider }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error creating provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
