import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { memoryService } from '@/lib/alex/memory'
import { MemoryUpdateInput } from '@/lib/alex/types'

// PATCH /api/alex/memories/[id] - Update a memory
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await auth()
    const { userId } = authResult

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, importance, is_active } = body

    const updates: MemoryUpdateInput = {}
    if (content !== undefined) updates.content = content
    if (importance !== undefined) updates.importance = importance
    if (is_active !== undefined) updates.is_active = is_active

    const memory = await memoryService.updateMemory(params.id, userId, updates)

    return NextResponse.json({
      success: true,
      memory
    })
  } catch (error) {
    console.error('[Memory API] Update memory failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update memory' },
      { status: 500 }
    )
  }
}

// DELETE /api/alex/memories/[id] - Delete a memory
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await auth()
    const { userId } = authResult

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await memoryService.deleteMemory(params.id, userId)

    return NextResponse.json({
      success: true,
      message: 'Memory deleted successfully'
    })
  } catch (error) {
    console.error('[Memory API] Delete memory failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete memory' },
      { status: 500 }
    )
  }
}
