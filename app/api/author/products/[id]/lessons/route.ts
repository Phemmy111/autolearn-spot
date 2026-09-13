import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  getLessonsForProduct, 
  createProductLesson,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl
} from '@/lib/lesson-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/products/[id]/lessons
 * Get all lessons for a specific product
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId } = await params
    const lessons = await getLessonsForProduct(productId)

    return NextResponse.json({ success: true, lessons })
  } catch (error: any) {
    console.error('[GET /api/author/products/[id]/lessons] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/author/products/[id]/lessons
 * Create a new lesson for a product
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

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 })
    }

    // Process YouTube URL if provided
    let youtubeVideoId = null
    let youtubeThumbnail = null
    
    if (body.youtube_url) {
      youtubeVideoId = extractYouTubeVideoId(body.youtube_url)
      if (!youtubeVideoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
      }
      // Auto-generate thumbnail from YouTube
      youtubeThumbnail = getYouTubeThumbnailUrl(youtubeVideoId)
    }

    const lessonData = {
      title: body.title,
      description: body.description || null,
      youtube_url: body.youtube_url || null,
      youtube_video_id: youtubeVideoId,
      youtube_thumbnail: youtubeThumbnail,
      duration_label: body.duration_label || null,
      is_required: body.is_required ?? true,
      unlock_config: body.unlock_config || {},
      resources: body.resources || []
    }

    const lesson = await createProductLesson(productId, lessonData)

    if (!lesson) {
      return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lesson })
  } catch (error: any) {
    console.error('[POST /api/author/products/[id]/lessons] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
