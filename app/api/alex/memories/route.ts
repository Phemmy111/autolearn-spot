import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { memoryService } from '@/lib/alex/memory'
import { MemoryCreateInput, MemoryUpdateInput } from '@/lib/alex/types'

// GET /api/alex/memories - List user memories
export async function GET(request: NextRequest) {
  try {
    const authResult = await auth()
    const { userId } = authResult

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const memoryType = searchParams.get('memory_type') as any
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const result = await memoryService.listMemories(userId, {
      memoryType,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      memories: result.memories,
      total: result.total
    })
  } catch (error) {
    console.error('[Memory API] List memories failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list memories' },
      { status: 500 }
    )
  }
}

// POST /api/alex/memories - Create a memory
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const { userId } = authResult

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, memory_type, importance, source, source_conversation_id } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const input: MemoryCreateInput = {
      content,
      memory_type,
      importance,
      source,
      source_conversation_id
    }

    const memory = await memoryService.createMemory(userId, input)

    return NextResponse.json({
      success: true,
      memory
    })
  } catch (error) {
    console.error('[Memory API] Create memory failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create memory' },
      { status: 500 }
    )
  }
}

// DELETE /api/alex/memories - Delete all memories
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await auth()
    const { userId } = authResult

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deletedCount = await memoryService.deleteAllMemories(userId)

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount
    })
  } catch (error) {
    console.error('[Memory API] Delete all memories failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete memories' },
      { status: 500 }
    )
  }
}
