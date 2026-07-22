import { supabaseAdmin } from '@/lib/supabase'

// Fixed Cohort 1 UUID — matches supabase-phase0-schema.sql seed
const DEFAULT_COHORT_ID = 'a1111111-1111-1111-1111-111111111111'

export interface LessonProgress {
  id: string
  cohort_id: string
  lesson_id: string
  user_id: string
  completed: boolean
  watch_pct: number
  last_position_seconds: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ProgressSummary {
  completed: number
  total: number
  percentage: number
}

/**
 * Get the current cohort ID. Falls back to the hardcoded Cohort 1 UUID.
 */
export async function getCurrentCohortId(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('cohorts')
    .select('id')
    .eq('is_current', true)
    .single()

  return data?.id || DEFAULT_COHORT_ID
}

/**
 * Fetch all lesson progress rows for a user in a cohort.
 */
export async function getUserProgress(
  userId: string,
  cohortId?: string
): Promise<LessonProgress[]> {
  const cid = cohortId || (await getCurrentCohortId())

  const { data, error } = await supabaseAdmin
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('cohort_id', cid)
    .order('lesson_id', { ascending: true })

  if (error) {
    console.error('[progress-service] getUserProgress error:', error)
    return []
  }

  return (data as LessonProgress[]) || []
}

/**
 * Upsert a single lesson progress row.
 * Auto-marks completed when watchPct >= 90.
 */
export async function upsertLessonProgress(
  userId: string,
  cohortId: string,
  lessonId: string,
  data: {
    watchPct?: number
    lastPositionSeconds?: number
    completed?: boolean
  }
): Promise<LessonProgress | null> {
  const now = new Date().toISOString()
  const shouldComplete =
    data.completed === true || (data.watchPct !== undefined && data.watchPct >= 90)

  const upsertData: Record<string, unknown> = {
    cohort_id: cohortId,
    lesson_id: lessonId,
    user_id: userId,
    updated_at: now,
  }

  if (data.watchPct !== undefined) {
    upsertData.watch_pct = Math.min(100, Math.max(0, Math.round(data.watchPct)))
  }
  if (data.lastPositionSeconds !== undefined) {
    upsertData.last_position_seconds = Math.max(0, Math.round(data.lastPositionSeconds))
  }
  if (shouldComplete) {
    upsertData.completed = true
    upsertData.completed_at = now
    // Ensure watch_pct is at least 90 when marking complete
    if (!data.watchPct || data.watchPct < 90) {
      upsertData.watch_pct = 100
    }
  }

  const { data: row, error } = await supabaseAdmin
    .from('lesson_progress')
    .upsert(upsertData, { onConflict: 'cohort_id,lesson_id,user_id' })
    .select()
    .single()

  if (error) {
    console.error('[progress-service] upsertLessonProgress error:', error)
    return null
  }

  return row as LessonProgress
}

/**
 * Migrate completed lesson IDs from localStorage into Supabase.
 * Idempotent: skips if any lesson_progress records already exist for this user+cohort.
 * Only inserts lesson IDs that exist in the lessons table.
 */
export async function migrateLocalStorageProgress(
  userId: string,
  cohortId: string,
  completedLessonIds: string[]
): Promise<{ migrated: boolean; count: number; reason?: string }> {
  if (!completedLessonIds || completedLessonIds.length === 0) {
    return { migrated: false, count: 0, reason: 'no_data' }
  }

  // Check if user already has any progress records (idempotent guard)
  const { count, error: countError } = await supabaseAdmin
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)

  if (countError) {
    console.error('[progress-service] migrateLocalStorageProgress count error:', countError)
    return { migrated: false, count: 0, reason: 'db_error' }
  }

  if (count && count > 0) {
    return { migrated: false, count: 0, reason: 'already_exists' }
  }

  // Fetch valid lesson IDs from lessons table
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('cohort_id', cohortId)

  const validLessonIds = new Set((lessons || []).map((l: { id: string }) => l.id))
  const now = new Date().toISOString()

  const rows = completedLessonIds
    .filter((id) => validLessonIds.has(id))
    .map((lessonId) => ({
      cohort_id: cohortId,
      lesson_id: lessonId,
      user_id: userId,
      completed: true,
      watch_pct: 100,
      last_position_seconds: 0,
      completed_at: now,
      created_at: now,
      updated_at: now,
    }))

  if (rows.length === 0) {
    return { migrated: false, count: 0, reason: 'no_valid_lessons' }
  }

  const { error } = await supabaseAdmin.from('lesson_progress').insert(rows)

  if (error) {
    console.error('[progress-service] migrateLocalStorageProgress insert error:', error)
    return { migrated: false, count: 0, reason: 'insert_error' }
  }

  console.log(`[progress-service] Migrated ${rows.length} progress records for user ${userId}`)
  return { migrated: true, count: rows.length }
}

/**
 * Get a summary of completion for a user in a cohort.
 */
export async function getCompletionSummary(
  userId: string,
  cohortId?: string
): Promise<ProgressSummary> {
  const cid = cohortId || (await getCurrentCohortId())

  // Count total lessons in cohort
  const { count: totalCount } = await supabaseAdmin
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cid)

  // Count completed lessons for user
  const { count: completedCount } = await supabaseAdmin
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cohort_id', cid)
    .eq('completed', true)

  const total = totalCount || 0
  const completed = completedCount || 0
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return { completed, total, percentage }
}
