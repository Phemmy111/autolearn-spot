import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/alex/artifacts/approve - Handle architecture approval and trigger artifact generation
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, plan } = body

    if (!conversationId || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[Artifact Approval] Processing approval request:', {
      conversationId,
      userId,
      objective: plan.objective
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing database configuration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get active build
    const { data: activeBuild, error: buildError } = await supabase
      .from('alex_artifact_builds')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .in('status', ['collecting_requirements', 'designing_architecture', 'awaiting_architecture_verification'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (buildError || !activeBuild) {
      return NextResponse.json({ error: 'No active build found' }, { status: 404 })
    }

    console.log('[Artifact Approval] Active build found:', activeBuild.id)

    // Import the workflow orchestrator to handle artifact generation
    const { WorkflowOrchestrator } = await import('@/lib/alex/orchestration/workflow-orchestrator')
    const workflowOrchestrator = WorkflowOrchestrator.getInstance()

    // Trigger artifact generation directly via handleApproval
    const response = await workflowOrchestrator.handleApproval(conversationId, userId)

    console.log('[Artifact Approval] Artifact generation response:', response.status)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Artifact Approval] Error:', error)
    return NextResponse.json({ error: 'Artifact approval failed' }, { status: 500 })
  }
}