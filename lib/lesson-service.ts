import { supabaseAdmin } from '@/lib/supabase'

export interface Lesson {
  id: string
  cohort_id: string | null
  product_id: string | null
  title: string
  description: string | null
  vdo_cipher_video_id: string | null
  vimeo_video_id: string | null
  youtube_url: string | null
  youtube_video_id: string | null
  youtube_thumbnail: string | null
  available_at: string
  duration_label: string | null
  week_number: number | null
  session_number: number | null
  release_day: string | null
  resources: any
  order_index: number
  status: string
  is_required: boolean
  unlock_config: any
  created_at: string
  updated_at: string
}

export interface Cohort {
  id: string
  name: string
  slug: string
  status: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  timezone: string
  settings: any
}

/**
 * Get all lessons for a specific cohort
 */
export async function getLessonsForCohort(cohortId: string): Promise<Lesson[]> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('[lesson-service] Error fetching lessons:', error)
    return []
  }

  return (data as Lesson[]) || []
}

/**
 * Get a single lesson by ID and cohort
 */
export async function getLessonForCohort(lessonId: string, cohortId: string): Promise<Lesson | null> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .eq('cohort_id', cohortId)
    .single()

  if (error) {
    console.error('[lesson-service] Error fetching lesson:', error)
    return null
  }

  return data as Lesson | null
}

/**
 * Update lesson availability time
 */
export async function updateLessonAvailability(
  lessonId: string,
  cohortId: string,
  availableAt: string
): Promise<Lesson | null> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .update({ available_at: availableAt, updated_at: new Date().toISOString() })
    .eq('id', lessonId)
    .eq('cohort_id', cohortId)
    .select()
    .single()

  if (error) {
    console.error('[lesson-service] Error updating lesson availability:', error)
    return null
  }

  return data as Lesson | null
}

/**
 * Update lesson release day
 */
export async function updateLessonReleaseDay(
  lessonId: string,
  cohortId: string,
  releaseDay: string
): Promise<Lesson | null> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .update({ release_day: releaseDay, updated_at: new Date().toISOString() })
    .eq('id', lessonId)
    .eq('cohort_id', cohortId)
    .select()
    .single()

  if (error) {
    console.error('[lesson-service] Error updating lesson release day:', error)
    return null
  }

  return data as Lesson | null
}

/**
 * Check if a lesson is currently available based on its cohort-specific schedule
 */
export function isLessonAvailable(lesson: Lesson): boolean {
  return new Date() >= new Date(lesson.available_at)
}

/**
 * Get all cohorts
 */
export async function getAllCohorts(): Promise<Cohort[]> {
  const { data, error } = await supabaseAdmin
    .from('cohorts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[lesson-service] Error fetching cohorts:', error)
    return []
  }

  return (data as Cohort[]) || []
}

/**
 * Create a new lesson for a cohort
 */
export async function createLesson(cohortId: string, lessonData: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>): Promise<Lesson | null> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .insert({
      ...lessonData,
      cohort_id: cohortId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('[lesson-service] Error creating lesson:', error)
    return null
  }

  return data as Lesson | null
}

/**
 * Delete a lesson
 */
export async function deleteLesson(lessonId: string, cohortId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .eq('cohort_id', cohortId)

  if (error) {
    console.error('[lesson-service] Error deleting lesson:', error)
    return false
  }

  return true
}

/**
 * Format date for display in cohort timezone
 */
export function formatDateForCohort(dateString: string, timezone: string = 'Africa/Lagos'): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    })
  } catch (error) {
    console.error('[lesson-service] Error formatting date:', error)
    return dateString
  }
}

/**
 * Parse date string from form input (assumes YYYY-MM-DDTHH:mm format)
 */
export function parseDateInput(dateString: string, timezone: string = 'Africa/Lagos'): string {
  try {
    const date = new Date(dateString)
    // Ensure we store in UTC but display in cohort timezone
    return date.toISOString()
  } catch (error) {
    console.error('[lesson-service] Error parsing date:', error)
    return dateString
  }
}

// ============================================================================
// PRODUCT-BASED LESSON FUNCTIONS (Author Studio - Phase C)
// ============================================================================

/**
 * Get all lessons for a specific product (Author Studio)
 */
export async function getLessonsForProduct(productId: string): Promise<Lesson[]> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('product_id', productId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('[lesson-service] Error fetching product lessons:', error)
    return []
  }

  return (data as Lesson[]) || []
}

/**
 * Get a single lesson by ID and product
 */
export async function getLessonForProduct(lessonId: string, productId: string): Promise<Lesson | null> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .eq('product_id', productId)
    .single()

  if (error) {
    console.error('[lesson-service] Error fetching product lesson:', error)
    return null
  }

  return data as Lesson | null
}

/**
 * Create a new lesson for a product (Author Studio)
 */
export async function createProductLesson(productId: string, lessonData: Partial<Lesson>): Promise<Lesson | null> {
  // Generate a unique ID for the lesson (VARCHAR to match existing schema)
  const lessonId = `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Get the current max order_index for this product
  const { data: existingLessons } = await supabaseAdmin
    .from('lessons')
    .select('order_index')
    .eq('product_id', productId)
    .order('order_index', { ascending: false })
    .limit(1)
  
  const nextOrderIndex = (existingLessons?.[0]?.order_index ?? 0) + 1

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .insert({
      id: lessonId,
      product_id: productId,
      cohort_id: null, // Product-based lessons don't need cohort_id
      title: lessonData.title || 'Untitled Lesson',
      description: lessonData.description || null,
      youtube_url: lessonData.youtube_url || null,
      youtube_video_id: lessonData.youtube_video_id || null,
      youtube_thumbnail: lessonData.youtube_thumbnail || null,
      vdo_cipher_video_id: null,
      vimeo_video_id: null,
      available_at: new Date().toISOString(),
      duration_label: lessonData.duration_label || null,
      week_number: null,
      session_number: null,
      release_day: null,
      resources: lessonData.resources || '[]',
      order_index: nextOrderIndex,
      status: 'DRAFT',
      is_required: lessonData.is_required ?? true,
      unlock_config: lessonData.unlock_config || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('[lesson-service] Error creating product lesson:', error)
    return null
  }

  return data as Lesson | null
}

/**
 * Update a product lesson
 */
export async function updateProductLesson(lessonId: string, productId: string, updates: Partial<Lesson>): Promise<Lesson | null> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', lessonId)
    .eq('product_id', productId)
    .select()
    .single()

  if (error) {
    console.error('[lesson-service] Error updating product lesson:', error)
    return null
  }

  return data as Lesson | null
}

/**
 * Delete a product lesson
 */
export async function deleteProductLesson(lessonId: string, productId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .eq('product_id', productId)

  if (error) {
    console.error('[lesson-service] Error deleting product lesson:', error)
    return false
  }

  return true
}

/**
 * Reorder lessons for a product (update order_index for multiple lessons)
 */
export async function reorderProductLessons(productId: string, lessonIds: string[]): Promise<boolean> {
  try {
    // Update each lesson's order_index
    const updates = lessonIds.map((lessonId, index) => 
      supabaseAdmin
        .from('lessons')
        .update({ order_index: index, updated_at: new Date().toISOString() })
        .eq('id', lessonId)
        .eq('product_id', productId)
    )

    await Promise.all(updates)
    return true
  } catch (error) {
    console.error('[lesson-service] Error reordering product lessons:', error)
    return false
  }
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Get YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}
