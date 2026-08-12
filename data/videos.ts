import { VideoAsset } from '@/lib/video-provider'
import { supabaseAdmin } from '@/lib/supabase'

export interface VideoCourse {
  id: string
  title: string
  description: string
  vdoCipherVideoId?: string
  vimeoVideoId?: string
  youtubeVideoId?: string  // V2 engine — all 12 sessions now mapped
  availableAt: string
  duration: string
  week: number
  resources?: { label: string; url: string }[]
}

export interface DatabaseLesson {
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
}

export const videos: VideoCourse[] = [
  // ── Week 1 ────────────────────────────────────────────────────
  {
    id: 'wk1-vid1',
    title: 'Session 1: n8n Theory & Account Setup',
    description: 'Introduction to n8n, how to set up your account, and the core concepts of nodes, triggers, and credentials.',
    vdoCipherVideoId: '3265363f31454fad9974f182387ce2b1',
    youtubeVideoId: 'VXL590SV1Gw',   // Week 1 Day 1
    availableAt: '2026-07-13T00:00:00Z',
    duration: '30 mins',
    week: 1,
  },
  {
    id: 'wk1-vid2',
    title: 'Session 2: Form to Email Automation',
    description: 'Build your first automation: trigger a workflow from a webhook/form and send an email automatically.',
    vdoCipherVideoId: '2cf57e7b9f9943319c6ab4f4453927c3',
    youtubeVideoId: '5gmC5976Lf8',   // Week 1 Day 2
    availableAt: '2026-07-15T00:00:00Z',
    duration: '30 mins',
    week: 1,
  },
  {
    id: 'wk1-vid3',
    title: 'Session 3: Google Sheets Integration',
    description: 'Learn how to read from and write to Google Sheets to store your automation data permanently.',
    vdoCipherVideoId: '37aba51d45174e7d81324ae262f67d4b',
    youtubeVideoId: '1WO-oVGZKZk',   // Week 1 Day 3
    availableAt: '2026-07-17T00:00:00Z',
    duration: '35 mins',
    week: 1,
  },

  // ── Week 2 ────────────────────────────────────────────────────
  {
    id: 'wk2-vid1',
    title: 'Session 4: Connecting AI to Your Workflows',
    description: 'Learn how to integrate ChatGPT and process incoming data with AI.',
    vimeoVideoId: '1209374969',
    youtubeVideoId: 'TnoTbtJApZ0',   // Week 2 Day 4
    availableAt: '2026-07-20T00:00:00Z',
    duration: '45 mins',
    week: 2,
  },
  {
    id: 'wk2-vid2',
    title: 'Session 5: AI Email Auto-Responder',
    description: 'Learn how to automatically read incoming emails, generate a response using AI, and send it back.',
    vimeoVideoId: '1209383076',
    youtubeVideoId: 'RoJxAfYfoUw',   // Week 2 Day 5
    availableAt: '2026-07-22T00:00:00Z',
    duration: '40 mins',
    week: 2,
  },
  {
    id: 'wk2-vid3',
    title: 'Session 6: AI Content Summarizer',
    description: 'Learn how to scrape website content and use AI to generate concise summaries.',
    vimeoVideoId: '1209384996',
    youtubeVideoId: 'gfIgz05XpgM',   // Week 2 Day 6
    availableAt: '2026-07-24T00:00:00Z',
    duration: '35 mins',
    week: 2,
  },

  // ── Week 3 ────────────────────────────────────────────────────
  {
    id: 'wk3-vid1',
    title: 'Session 7: Week 3 Monday',
    description: 'Week 3 Session 1',
    vimeoVideoId: '1212926093',
    youtubeVideoId: 'ojHX4n-Dv9I',   // Week 3 Day 7
    availableAt: '2026-07-27T00:00:00Z',
    duration: '23 mins',
    week: 3,
  },
  {
    id: 'wk3-vid2',
    title: 'Session 8: Week 3 Wednesday',
    description: 'Week 3 Session 2',
    vimeoVideoId: '1212944798',
    youtubeVideoId: 'gNKFHCLN_F4',   // Week 3 Day 8
    availableAt: '2026-07-29T00:00:00Z',
    duration: '1hr 2mins',
    week: 3,
  },
  {
    id: 'wk3-vid3',
    title: 'Session 9: Week 3 Friday',
    description: 'Week 3 Session 3',
    vimeoVideoId: '1213005975',
    youtubeVideoId: 'Z_Zo41yNfZU',   // Week 3 Day 9
    availableAt: '2026-07-31T00:00:00Z',
    duration: 'TBD',
    week: 3,
  },

  // ── Week 4 ────────────────────────────────────────────────────
  {
    id: 'wk4-vid1',
    title: 'Session 10: Week 4 Monday',
    description: 'Week 4 Session 1',
    vimeoVideoId: '1212965316',
    youtubeVideoId: 'PsbjAA48rlk',   // Week 4 Day 10
    availableAt: '2026-08-03T00:00:00Z',
    duration: '25 mins',
    week: 4,
  },
  {
    id: 'wk4-vid2',
    title: 'Session 11: Week 4 Wednesday',
    description: 'Week 4 Session 2',
    vimeoVideoId: '1212966091',
    youtubeVideoId: 'WlPVxMrcAV4',   // Week 4 Day 11
    availableAt: '2026-08-05T00:00:00Z',
    duration: '13 mins',
    week: 4,
  },
  {
    id: 'wk4-vid3',
    title: 'Session 12: Week 4 Friday',
    description: 'Week 4 Session 3',
    vimeoVideoId: '1212966090',
    youtubeVideoId: 'deMcOpk-2qM',   // Week 4 Day 12
    availableAt: '2026-08-07T00:00:00Z',
    duration: '2 mins',
    week: 4,
  },
]

/** Check if a video is available based on its scheduled date */
export function isVideoAvailable(video: VideoCourse): boolean {
  return new Date() >= new Date(video.availableAt)
}

/**
 * Check if a video is available based on database schedule for a specific cohort
 * Falls back to data/videos.ts if no database record exists
 */
export async function isVideoAvailableForCohort(
  videoId: string, 
  cohortId: string
): Promise<boolean> {
  try {
    // Query database for cohort-specific lesson availability
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('available_at')
      .eq('id', videoId)
      .eq('cohort_id', cohortId)
      .single()

    if (error || !data) {
      console.log(`[isVideoAvailableForCohort] No database record for ${videoId} in cohort ${cohortId}, falling back to data/videos.ts`)
      // Fallback to data/videos.ts if no database record
      const video = videos.find(v => v.id === videoId)
      if (!video) return false
      return isVideoAvailable(video)
    }

    // Use database available_at timestamp
    return new Date() >= new Date(data.available_at)
  } catch (error) {
    console.error('[isVideoAvailableForCohort] Error:', error)
    // Fallback to data/videos.ts on error
    const video = videos.find(v => v.id === videoId)
    if (!video) return false
    return isVideoAvailable(video)
  }
}

/**
 * Get cohort-specific lesson data with availability info
 * Merges database data with data/videos.ts fallback
 */
export async function getLessonForCohort(
  videoId: string, 
  cohortId: string
): Promise<VideoCourse | null> {
  try {
    // Query database for cohort-specific lesson
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('id', videoId)
      .eq('cohort_id', cohortId)
      .single()

    if (error || !data) {
      console.log(`[getLessonForCohort] No database record for ${videoId} in cohort ${cohortId}, falling back to data/videos.ts`)
      // Fallback to data/videos.ts
      return videos.find(v => v.id === videoId) || null
    }

    // Convert database lesson to VideoCourse format
    const dbLesson = data as DatabaseLesson
    return {
      id: dbLesson.id,
      title: dbLesson.title,
      description: dbLesson.description || '',
      vdoCipherVideoId: dbLesson.vdo_cipher_video_id || undefined,
      vimeoVideoId: dbLesson.vimeo_video_id || undefined,
      youtubeVideoId: undefined, // Would need to add this field to database
      availableAt: dbLesson.available_at,
      duration: dbLesson.duration_label || 'Unknown',
      week: dbLesson.week_number,
      resources: dbLesson.resources || []
    }
  } catch (error) {
    console.error('[getLessonForCohort] Error:', error)
    // Fallback to data/videos.ts on error
    return videos.find(v => v.id === videoId) || null
  }
}

/**
 * Build a VideoAsset for the given VideoCourse.
 * When V2 is enabled and a YouTube ID exists → YouTube provider.
 * Otherwise falls back to Vimeo then VdoCipher (legacy).
 */
export function toVideoAsset(video: VideoCourse, useV2: boolean): VideoAsset {
  if (useV2 && video.youtubeVideoId) {
    return {
      id: video.id,
      provider: 'youtube',
      videoId: video.youtubeVideoId,
      legacy: video.vimeoVideoId
        ? { provider: 'vimeo', videoId: video.vimeoVideoId }
        : video.vdoCipherVideoId
          ? { provider: 'vdocipher', videoId: video.vdoCipherVideoId }
          : undefined,
    }
  }

  if (video.vimeoVideoId) {
    return { id: video.id, provider: 'vimeo', videoId: video.vimeoVideoId }
  }

  if (video.vdoCipherVideoId) {
    return { id: video.id, provider: 'vimeo', videoId: video.vdoCipherVideoId }
  }

  return { id: video.id, provider: 'youtube', videoId: '' }
}
