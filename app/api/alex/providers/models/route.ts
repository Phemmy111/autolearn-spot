import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const apiKey = searchParams.get('apiKey')

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Missing provider or apiKey' }, { status: 400 })
    }

    let models: { id: string, name: string }[] = []

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
      if (!res.ok) throw new Error('Failed to fetch OpenAI models')
      const data = await res.json()
      models = data.data
        .filter((m: any) => m.id.includes('gpt'))
        .map((m: any) => ({ id: m.id, name: m.id }))
        .sort((a: any, b: any) => a.id.localeCompare(b.id))
    } 
    else if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      })
      if (!res.ok) throw new Error('Failed to fetch Anthropic models')
      const data = await res.json()
      models = data.data
        .filter((m: any) => m.type === 'model')
        .map((m: any) => ({ id: m.id, name: m.display_name || m.id }))
    }
    else if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
      if (!res.ok) throw new Error('Failed to fetch Groq models')
      const data = await res.json()
      models = data.data
        .map((m: any) => ({ id: m.id, name: m.id }))
        .sort((a: any, b: any) => a.id.localeCompare(b.id))
    }
    else if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      if (!res.ok) throw new Error('Failed to fetch Gemini models')
      const data = await res.json()
      models = data.models
        .filter((m: any) => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'))
        .map((m: any) => {
          const id = m.name.replace('models/', '')
          return { id, name: m.displayName || id }
        })
    }
    else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
    }

    return NextResponse.json({ models })
  } catch (error: any) {
    console.error('[API] Failed to fetch models:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch models' }, { status: 500 })
  }
}
