/**
 * Video Engine Feature Toggle
 *
 * V2 (YouTube) is now permanently enabled for ALL users on ALL devices.
 * The localStorage toggle has been removed — migration is complete.
 */

/**
 * Check if Video Engine V2 (YouTube) is enabled.
 * Always returns true — V2 is the permanent engine.
 */
export function isVideoEngineV2(): boolean {
  return true
}

/**
 * No-op: V2 is permanently enabled; this function is kept for API compatibility.
 */
export function setVideoEngineV2(_enabled: boolean): void {
  // V2 is permanently enabled — no toggle needed
}

/**
 * Returns the current video engine version.
 * Always returns 'v2'.
 */
export function getVideoEngineVersion(): 'v1' | 'v2' {
  return 'v2'
}
