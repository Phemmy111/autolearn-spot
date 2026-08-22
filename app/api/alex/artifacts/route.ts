import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ArtifactWorkflowManager, WorkflowRequest } from '@/lib/alex/artifact-generation/workflow-manager'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/alex/artifacts - Process artifact generation request
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, content, attachedFiles, conversationHistory } = body

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[Artifact API] Processing artifact request:', {
      conversationId,
      userId,
      content: content.substring(0, 100)
    })

    const workflowRequest: WorkflowRequest = {
      conversationId,
      userId,
      content,
      attachedFiles,
      conversationHistory
    }

    const response = await ArtifactWorkflowManager.processRequest(workflowRequest)

    console.log('[Artifact API] Workflow response:', response.status)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Artifact API] Error:', error)
    return NextResponse.json({ error: 'Artifact generation failed' }, { status: 500 })
  }
}
