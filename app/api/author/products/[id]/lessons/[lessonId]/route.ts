import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  updateProductLesson,
  deleteProductLesson,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl
} from '@/lib/lesson-service'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/author/products/[id]/lessons/[lessonId]
 * Update a specific lesson
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, lessonId } = await params
    const body = await request.json()

    // Process YouTube URL if provided
    let youtubeVideoId = body.youtube_video_id
    let youtubeThumbnail = body.youtube_thumbnail
    
    if (body.youtube_url) {
      youtubeVideoId = extractYouTubeVideoId(body.youtube_url)
      if (!youtubeVideoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
      }
      // Auto-generate thumbnail from YouTube
      youtubeThumbnail = getYouTubeThumbnailUrl(youtubeVideoId)
    }

    const updates: any = {
      title: body.title,
      description: body.description,
      youtube_url: body.youtube_url,
      youtube_video_id: youtubeVideoId,
      youtube_thumbnail: youtubeThumbnail,
      duration_label: body.duration_label,
      status: body.status,
      is_required: body.is_required,
      unlock_config: body.unlock_config,
      resources: body.resources
    }

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key]
      }
    })

    const lesson = await updateProductLesson(lessonId, productId, updates)

    if (!lesson) {
      return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lesson })
  } catch (error: any) {
    console.error('[PUT /api/author/products/[id]/lessons/[lessonId]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/author/products/[id]/lessons/[lessonId]
 * Delete a specific lesson
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, lessonId } = await params

    const success = await deleteProductLesson(lessonId, productId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/author/products/[id]/lessons/[lessonId]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
