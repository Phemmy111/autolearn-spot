import { supabaseAdmin } from '@/lib/supabase'

export interface Lesson {
  id: string
  cohort_id: string
  title: string
  description: string | null
  vdo_cipher_video_id: string | null
  vimeo_video_id: string | null
  available_at: string
  duration_label: string | null
  week_number: number
  session_number: number
  release_day: string
  resources: any
  order_index: number
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
