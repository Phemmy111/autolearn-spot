import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AIProviderManager, ProviderConfig } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/ai-providers
 * Get AI providers for the authenticated author
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: providers, error } = await supabaseAdmin
      .from('ai_providers')
      .select('*')
      .eq('author_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/author/ai-providers] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ providers: providers || [] })
  } catch (error: any) {
    console.error('[GET /api/author/ai-providers] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/author/ai-providers
 * Create a new AI provider for the authenticated author
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // If this is set as default, unset other default providers for this author
    if (body.is_default) {
      await supabaseAdmin
        .from('ai_providers')
        .update({ is_default: false })
        .eq('author_id', userId)
    }

    const config: ProviderConfig = {
      name,
      provider_type,
      api_key,
      base_url,
      default_model,
    }

    // Create provider using AIProviderManager
    const provider = await AIProviderManager.createProvider(config, userId)

    if (!provider) {
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
    }

    // Update the provider to set author_id (AIProviderManager doesn't know about author_id)
    const { data: updatedProvider, error: updateError } = await supabaseAdmin
      .from('ai_providers')
      .update({ author_id: userId })
      .eq('id', provider.id)
      .select()
      .single()

    if (updateError) {
      console.error('[POST /api/author/ai-providers] Error setting author_id:', updateError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({ provider: updatedProvider || provider }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/author/ai-providers] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
