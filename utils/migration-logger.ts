/**
 * Temporary Migration Logger
 * 
 * Logs video engine migration events to the browser console.
 * All logs are prefixed with [VideoEngine] for easy filtering.
 * 
 * Remove this module after migration is fully verified.
 */

const PREFIX = '[VideoEngine]'

export const migrationLog = {
  /** Log when a video starts playing */
  playback(lessonId: string, provider: string, videoId: string) {
    console.log(`${PREFIX} ▶️ PLAY lessonId=${lessonId} provider=${provider} videoId=${videoId}`)
  },

  /** Log when playback pauses */
  pause(lessonId: string, currentTime: number) {
    console.log(`${PREFIX} ⏸️ PAUSE lessonId=${lessonId} at=${currentTime.toFixed(1)}s`)
  },

  /** Log when progress is saved to the server */
  progressSave(lessonId: string, watchPct: number, lastPositionSeconds: number) {
    console.log(
      `${PREFIX} 💾 SAVE lessonId=${lessonId} watchPct=${watchPct.toFixed(1)}% position=${lastPositionSeconds.toFixed(1)}s`
    )
  },

  /** Log when progress save fails */
  progressSaveError(lessonId: string, error: unknown) {
    console.error(`${PREFIX} ❌ SAVE FAILED lessonId=${lessonId}`, error)
  },

  /** Log when playback resumes from a saved position */
  resume(lessonId: string, fromSeconds: number) {
    console.log(`${PREFIX} ⏩ RESUME lessonId=${lessonId} from=${fromSeconds.toFixed(1)}s`)
  },

  /** Log when a lesson is marked as complete */
  completion(lessonId: string, watchPct: number) {
    console.log(`${PREFIX} ✅ COMPLETE lessonId=${lessonId} watchPct=${watchPct.toFixed(1)}%`)
  },

  /** Log when the video player encounters an error */
  error(lessonId: string, message: string, detail?: unknown) {
    console.error(`${PREFIX} 🚨 ERROR lessonId=${lessonId} msg=${message}`, detail || '')
  },

  /** Log when the feature toggle is switched */
  toggleSwitch(enabled: boolean) {
    console.log(`${PREFIX} 🔀 TOGGLE videoEngineV2=${enabled}`)
  },

  /** Log when the player component mounts with a specific provider */
  mount(lessonId: string, provider: string, engine: 'v1' | 'v2') {
    console.log(`${PREFIX} 🔧 MOUNT lessonId=${lessonId} provider=${provider} engine=${engine}`)
  },

  /** Log when thumbnail fallback is triggered */
  thumbnailFallback(lessonId: string, from: string, to: string) {
    console.log(`${PREFIX} 🖼️ THUMBNAIL FALLBACK lessonId=${lessonId} from=${from} to=${to}`)
  },
}
