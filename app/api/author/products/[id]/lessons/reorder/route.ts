import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { reorderProductLessons } from '@/lib/lesson-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/author/products/[id]/lessons/reorder
 * Reorder lessons for a product
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId } = await params
    const body = await request.json()

    // Validate lessonIds array
    if (!body.lessonIds || !Array.isArray(body.lessonIds)) {
      return NextResponse.json({ error: 'lessonIds array is required' }, { status: 400 })
    }

    const success = await reorderProductLessons(productId, body.lessonIds)

    if (!success) {
      return NextResponse.json({ error: 'Failed to reorder lessons' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[POST /api/author/products/[id]/lessons/reorder] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
