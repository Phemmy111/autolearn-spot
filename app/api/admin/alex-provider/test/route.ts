import { NextRequest, NextResponse } from 'next/server'
import { AlexProviderType, PROVIDER_CONFIGS } from '@/lib/alex/alex-provider'
import { currentUser } from '@clerk/nextjs/server'

// POST /api/admin/alex-provider/test - Test provider connection
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    // You may want to add admin verification here

    const body = await request.json()
    const { provider_type, api_key, base_url } = body

    if (!provider_type || !api_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const config = PROVIDER_CONFIGS[provider_type as AlexProviderType]
    const baseUrl = base_url || config.baseUrl

    // Test with a simple API call
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `API returned ${response.status}: ${response.statusText}` 
      }, { status: 200 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in POST /api/admin/alex-provider/test:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Connection failed' 
    }, { status: 200 })
  }
}