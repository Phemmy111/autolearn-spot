import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { AIProviderManager } from '@/lib/ai-provider'

// POST - Admin only: Generate AI completion
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { prompt, providerId, model, temperature, maxTokens } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await AIProviderManager.completion(prompt, {
      providerId,
      model,
      temperature,
      maxTokens,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Unexpected error in AI completion:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
