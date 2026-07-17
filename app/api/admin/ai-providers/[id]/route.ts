import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { AIProviderManager, ProviderConfig } from '@/lib/ai-provider'

// PUT - Super Admin only: Update AI provider
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { name, provider_type, api_key, base_url, default_model } = body

    const config: Partial<ProviderConfig> = {}
    if (name) config.name = name
    if (provider_type) config.provider_type = provider_type
    if (api_key) config.api_key = api_key
    if (base_url !== undefined) config.base_url = base_url
    if (default_model !== undefined) config.default_model = default_model

    const provider = await AIProviderManager.updateProvider(params.id, config)

    if (!provider) {
      return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
    }

    return NextResponse.json({ provider })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error updating provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Super Admin only: Delete AI provider
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const success = await AIProviderManager.deleteProvider(params.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error deleting provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
