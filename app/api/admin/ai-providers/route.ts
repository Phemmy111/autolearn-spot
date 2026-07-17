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
    console.log('Starting AI provider creation...')
    await requireSuperAdmin()
    console.log('Super admin check passed')

    const body = await request.json()
    console.log('Request body received:', { name: body.name, provider_type: body.provider_type, base_url: body.base_url, default_model: body.default_model })
    
    const { name, provider_type, api_key, base_url, default_model } = body

    // Validate required fields
    if (!name || !provider_type || !api_key) {
      console.log('Validation failed: missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTypes = ['openrouter', 'openai', 'gemini', 'groq']
    if (!validTypes.includes(provider_type)) {
      console.log('Validation failed: invalid provider type')
      return NextResponse.json({ error: 'Invalid provider type' }, { status: 400 })
    }

    // Get current user info
    const user = await currentUser()
    const createdBy = user?.id
    console.log('Current user ID:', createdBy)

    const config: ProviderConfig = {
      name,
      provider_type,
      api_key,
      base_url,
      default_model,
    }

    console.log('Calling AIProviderManager.createProvider...')
    const provider = await AIProviderManager.createProvider(config, createdBy || '')
    console.log('Provider creation result:', provider)

    if (!provider) {
      console.log('Provider creation returned null')
      return NextResponse.json({ error: 'Failed to create provider - returned null' }, { status: 500 })
    }

    return NextResponse.json({ provider }, { status: 201 })
  } catch (error: any) {
    console.error('Error in AI provider creation:', error)
    console.error('Error stack:', error.stack)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
