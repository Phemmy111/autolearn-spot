/**
 * Development-Friendly Feature Toggle
 * 
 * Controls whether the new YouTube video engine (V2) is active.
 * Uses localStorage only — no env vars, no redeployment needed.
 * 
 * Usage:
 *   - In browser console: localStorage.setItem('videoEngineV2', 'true')
 *   - Or use the admin debug page toggle button
 *   - Default: false (legacy Vimeo/VdoCipher player is used)
 */

const STORAGE_KEY = 'videoEngineV2'

/**
 * Check if Video Engine V2 (YouTube) is enabled.
 * Returns false on the server and when localStorage is not set.
 */
export function isVideoEngineV2(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Enable or disable Video Engine V2.
 */
export function setVideoEngineV2(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // localStorage may be blocked in some contexts
  }
}

/**
 * React hook wrapper for the feature toggle.
 * Note: This is a simple read — it does NOT trigger re-renders.
 * Components should call this on mount or on user action.
 */
export function getVideoEngineVersion(): 'v1' | 'v2' {
  return isVideoEngineV2() ? 'v2' : 'v1'
}
