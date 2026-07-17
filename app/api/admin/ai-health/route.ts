import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Admin only: Get AI health metrics
export async function GET() {
  try {
    await requireAdmin()

    // Get active provider
    const { data: defaultProvider } = await supabaseAdmin
      .from('ai_providers')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    // Get today's usage logs
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayLogs } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    // Get last successful request
    const { data: lastSuccess } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('*')
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get last failed request
    const { data: lastFailure } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('*')
      .eq('success', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Calculate metrics
    const totalRequests = todayLogs?.length || 0
    const successfulRequests = todayLogs?.filter((log: any) => log.success).length || 0
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0
    
    const responseTimes = todayLogs
      ?.filter((log: any) => log.success && log.response_time_ms)
      .map((log: any) => log.response_time_ms) || []
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length
      : 0

    const totalTokens = todayLogs
      ?.filter((log: any) => log.success && log.tokens_used)
      .reduce((sum: number, log: any) => sum + (log.tokens_used || 0), 0) || 0

    // Get provider status
    const { data: allProviders } = await supabaseAdmin
      .from('ai_providers')
      .select('*')
      .eq('is_active', true)

    return NextResponse.json({
      activeProvider: defaultProvider || null,
      activeModel: defaultProvider?.default_model || null,
      lastSuccessfulRequest: lastSuccess?.created_at || null,
      lastFailedRequest: lastFailure?.created_at || null,
      averageResponseTime: Math.round(avgResponseTime),
      providerStatus: allProviders?.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.provider_type,
        isDefault: p.is_default,
        isActive: p.is_active,
      })) || [],
      totalRequestsToday: totalRequests,
      successRate: Math.round(successRate),
      totalTokensToday: totalTokens,
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching AI health:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
