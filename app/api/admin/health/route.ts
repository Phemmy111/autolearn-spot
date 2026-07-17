import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  try {
    await requireAdmin()

    const startTime = Date.now()
    const healthChecks: Record<string, any> = {}

    // Database status check
    try {
      const { data, error } = await supabaseAdmin
        .from('quizzes')
        .select('id')
        .limit(1)
      healthChecks.database = {
        status: error ? 'error' : 'healthy',
        message: error ? error.message : 'Connected',
      }
    } catch (error: any) {
      healthChecks.database = {
        status: 'error',
        message: error.message || 'Connection failed',
      }
    }

    // Clerk status check (verify environment variables)
    healthChecks.clerk = {
      status: process.env.CLERK_SECRET_KEY ? 'healthy' : 'error',
      message: process.env.CLERK_SECRET_KEY ? 'Configured' : 'Missing secret key',
    }

    // OpenRouter API status check (using AI Provider Manager)
    const { AIProviderManager } = await import('@/lib/ai-provider')
    const defaultProvider = await AIProviderManager.getDefaultProvider()
    
    healthChecks.openrouter = {
      status: defaultProvider ? 'healthy' : 'error',
      message: defaultProvider ? `Using provider: ${defaultProvider.name}` : 'No AI provider configured',
    }

    // Supabase connection check
    healthChecks.supabase = {
      status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'healthy' : 'error',
      message: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing credentials',
    }

    // Get metrics
    const metrics: Record<string, any> = {}

    // Number of quizzes
    try {
      const { count, error } = await supabaseAdmin
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
      metrics.totalQuizzes = count || 0
    } catch (error) {
      metrics.totalQuizzes = 0
    }

    // Number of active quizzes
    try {
      const { count, error } = await supabaseAdmin
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      metrics.activeQuizzes = count || 0
    } catch (error) {
      metrics.activeQuizzes = 0
    }

    // Number of students (unique users in leaderboard)
    try {
      const { count, error } = await supabaseAdmin
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
      metrics.totalStudents = count || 0
    } catch (error) {
      metrics.totalStudents = 0
    }

    // Number of submissions today
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count, error } = await supabaseAdmin
        .from('quiz_responses')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', today.toISOString())
      metrics.submissionsToday = count || 0
    } catch (error) {
      metrics.submissionsToday = 0
    }

    // Total submissions
    try {
      const { count, error } = await supabaseAdmin
        .from('quiz_responses')
        .select('*', { count: 'exact', head: true })
      metrics.totalSubmissions = count || 0
    } catch (error) {
      metrics.totalSubmissions = 0
    }

    // Average score
    try {
      const { data, error } = await supabaseAdmin
        .from('quiz_responses')
        .select('percentage')
      if (data && data.length > 0) {
        const avgScore = data.reduce((sum, r) => sum + r.percentage, 0) / data.length
        metrics.averageScore = Math.round(avgScore)
      } else {
        metrics.averageScore = 0
      }
    } catch (error) {
      metrics.averageScore = 0
    }

    // Pass rate
    try {
      const { count: total, error } = await supabaseAdmin
        .from('quiz_responses')
        .select('*', { count: 'exact', head: true })
      const { count: passed } = await supabaseAdmin
        .from('quiz_responses')
        .select('*', { count: 'exact', head: true })
        .eq('passed', true)
      if (total && total > 0) {
        metrics.passRate = Math.round(((passed || 0) / total) * 100)
      } else {
        metrics.passRate = 0
      }
    } catch (error) {
      metrics.passRate = 0
    }

    // API response time
    const responseTime = Date.now() - startTime
    metrics.averageResponseTime = responseTime

    // Overall status
    const allHealthy = Object.values(healthChecks).every((check: any) => check.status === 'healthy')
    healthChecks.overall = {
      status: allHealthy ? 'healthy' : 'degraded',
      message: allHealthy ? 'All systems operational' : 'Some systems degraded',
    }

    return NextResponse.json({
      status: healthChecks.overall.status,
      checks: healthChecks,
      metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Health check error:', error)
    return NextResponse.json({ error: 'Failed to fetch health status' }, { status: 500 })
  }
}
