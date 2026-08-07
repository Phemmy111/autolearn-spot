import { supabase, supabaseAdmin } from './supabase'
import { Cohort, CohortStatus } from '@/types/cohort'

/**
 * Get the currently active cohort
 */
export async function getActiveCohort(): Promise<Cohort | null> {
  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'active')
    .single()

  if (error) {
    console.error('Error fetching active cohort:', error)
    return null
  }

  return data
}

/**
 * Get a cohort by ID
 */
export async function getCohortById(id: string): Promise<Cohort | null> {
  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching cohort by ID:', error)
    return null
  }

  return data
}

/**
 * Get all cohorts (admin only)
 */
export async function getAllCohorts(): Promise<Cohort[]> {
  const { data, error } = await supabaseAdmin
    .from('cohorts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all cohorts:', error)
    return []
  }

  return data || []
}

/**
 * Create a new cohort (admin only)
 */
export async function createCohort(cohort: Omit<Cohort, 'id' | 'created_at' | 'updated_at'>): Promise<Cohort | null> {
  const { data, error } = await supabaseAdmin
    .from('cohorts')
    .insert(cohort)
    .select()
    .single()

  if (error) {
    console.error('Error creating cohort:', error)
    return null
  }

  return data
}

/**
 * Update a cohort (admin only)
 */
export async function updateCohort(id: string, updates: Partial<Omit<Cohort, 'id' | 'created_at'>>): Promise<Cohort | null> {
  const { data, error } = await supabaseAdmin
    .from('cohorts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating cohort:', error)
    return null
  }

  return data
}

/**
 * Archive a cohort (admin only)
 */
export async function archiveCohort(id: string): Promise<Cohort | null> {
  return updateCohort(id, {
    status: 'archived',
    is_active: false,
    registration_open: false
  })
}

/**
 * Activate a cohort (admin only)
 */
export async function activateCohort(id: string): Promise<Cohort | null> {
  // First, deactivate all other cohorts
  await supabaseAdmin
    .from('cohorts')
    .update({ is_active: false })
    .neq('id', id)

  // Then activate the specified cohort
  return updateCohort(id, {
    status: 'active',
    is_active: true
  })
}

/**
 * Get upcoming cohorts
 */
export async function getUpcomingCohorts(): Promise<Cohort[]> {
  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('status', 'upcoming')
    .order('cohort_start', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming cohorts:', error)
    return []
  }

  return data || []
}

/**
 * Update current students count for a cohort (admin only)
 */
export async function updateCohortStudentCount(id: string, count: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('cohorts')
    .update({ current_students: count })
    .eq('id', id)

  if (error) {
    console.error('Error updating cohort student count:', error)
  }
}
