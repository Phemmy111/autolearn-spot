import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Super Admin only: Get cost controls
export async function GET() {
  try {
    await requireSuperAdmin()

    const { data, error } = await supabaseAdmin
      .from('ai_cost_controls')
      .select('*')
      .single()

    if (error) {
      // Return default controls if none exist
      return NextResponse.json({
        max_tokens: 4000,
        temperature: 0.7,
        daily_request_limit: 100,
        monthly_request_limit: 3000,
        max_retries: 3,
        request_timeout_ms: 30000,
        enabled: true,
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching cost controls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Super Admin only: Update cost controls
export async function PUT(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const {
      max_tokens,
      temperature,
      daily_request_limit,
      monthly_request_limit,
      max_retries,
      request_timeout_ms,
      enabled,
    } = body

    // Check if controls exist
    const { data: existing } = await supabaseAdmin
      .from('ai_cost_controls')
      .select('*')
      .single()

    let result
    if (existing) {
      result = await supabaseAdmin
        .from('ai_cost_controls')
        .update({
          max_tokens: max_tokens ?? existing.max_tokens,
          temperature: temperature ?? existing.temperature,
          daily_request_limit: daily_request_limit ?? existing.daily_request_limit,
          monthly_request_limit: monthly_request_limit ?? existing.monthly_request_limit,
          max_retries: max_retries ?? existing.max_retries,
          request_timeout_ms: request_timeout_ms ?? existing.request_timeout_ms,
          enabled: enabled !== undefined ? enabled : existing.enabled,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
    } else {
      result = await supabaseAdmin
        .from('ai_cost_controls')
        .insert({
          max_tokens: max_tokens || 4000,
          temperature: temperature || 0.7,
          daily_request_limit: daily_request_limit || 100,
          monthly_request_limit: monthly_request_limit || 3000,
          max_retries: max_retries || 3,
          request_timeout_ms: request_timeout_ms || 30000,
          enabled: enabled !== undefined ? enabled : true,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating cost controls:', result.error)
      return NextResponse.json({ error: 'Failed to update cost controls' }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error updating cost controls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
