import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ProviderManager } from '@/lib/alex/provider/provider-manager'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // allow up to 5 minutes

export async function GET(request: Request) {
  try {
    // Basic authorization checking for cron (Vercel sets this header)
    const authHeader = request.headers.get('authorization')
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('[Cron] Starting provider health check...')
    
    // Find providers that are currently active but marked as degraded or unavailable
    const { data: providers, error } = await supabaseAdmin
      .from('alex_provider_config')
      .select('id, display_name, health_status')
      .eq('is_active', true)
      .in('health_status', ['unavailable', 'degraded'])

    if (error) {
      console.error('[Cron] Error fetching providers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!providers || providers.length === 0) {
      console.log('[Cron] No degraded/unavailable providers found. All good!')
      return NextResponse.json({ success: true, message: 'All providers healthy' })
    }

    console.log(`[Cron] Found ${providers.length} providers needing health check.`)
    
    let recoveredCount = 0
    let failedCount = 0
    const manager = ProviderManager.getInstance()

    for (const provider of providers) {
      try {
        console.log(`[Cron] Testing provider: ${provider.display_name} (currently ${provider.health_status})`)
        const result = await manager.testProvider(provider.id)
        
        if (result.healthy) {
          console.log(`[Cron] Provider ${provider.display_name} has RECOVERED!`)
          recoveredCount++
        } else {
          console.log(`[Cron] Provider ${provider.display_name} is still failing.`)
          failedCount++
        }
      } catch (err: any) {
        console.error(`[Cron] Failed to test provider ${provider.display_name}:`, err.message)
        failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Provider health check completed',
      stats: {
        total: providers.length,
        recovered: recoveredCount,
        stillFailing: failedCount
      }
    })

  } catch (error) {
    console.error('[Cron] Fatal Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
