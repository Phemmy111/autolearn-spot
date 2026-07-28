/**
 * Video Provider Abstraction Layer
 * 
 * Provides a provider-agnostic interface for video playback.
 * Currently supports YouTube (active) and Vimeo (legacy).
 * Designed to be extended with Bunny.net, Cloudflare Stream, etc.
 */

export type VideoProvider = 'youtube' | 'vimeo' | 'bunny' | 'cloudflare'

export interface VideoAsset {
  /** Lesson identifier (e.g., "wk1-vid1") — must match existing lesson IDs */
  id: string
  /** Active video provider */
  provider: VideoProvider
  /** Provider-specific video ID */
  videoId: string
  /** Legacy fallback metadata (preserved for rollback) */
  legacy?: {
    provider: 'vimeo' | 'vdocipher'
    videoId: string
  }
}

/**
 * Build an embed URL for the given video asset.
 */
export function getEmbedUrl(asset: VideoAsset): string {
  switch (asset.provider) {
    case 'youtube':
      return `https://www.youtube.com/embed/${asset.videoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
    case 'vimeo':
      return `https://player.vimeo.com/video/${asset.videoId}?badge=0&autopause=0&player_id=0&app_id=58479&dnt=1`
    case 'bunny':
      // Placeholder for future implementation
      return `https://iframe.mediadelivery.net/embed/${asset.videoId}`
    case 'cloudflare':
      // Placeholder for future implementation
      return `https://customer-${asset.videoId}.cloudflarestream.com/iframe`
    default:
      return ''
  }
}

/**
 * Build a thumbnail URL for the given video asset.
 * YouTube: tries maxresdefault first, with hqdefault fallback.
 */
export function getThumbnailUrl(asset: VideoAsset, quality: 'max' | 'hq' = 'max'): string {
  switch (asset.provider) {
    case 'youtube':
      if (quality === 'max') {
        return `https://img.youtube.com/vi/${asset.videoId}/maxresdefault.jpg`
      }
      return `https://img.youtube.com/vi/${asset.videoId}/hqdefault.jpg`
    case 'vimeo':
      // Vimeo thumbnails require an API call; return empty for now
      return ''
    default:
      return ''
  }
}

/**
 * Get the fallback thumbnail URL when the primary fails to load.
 */
export function getThumbnailFallbackUrl(asset: VideoAsset): string {
  switch (asset.provider) {
    case 'youtube':
      return `https://img.youtube.com/vi/${asset.videoId}/hqdefault.jpg`
    default:
      return ''
  }
}

/**
 * Check if a provider is currently implemented and active.
 */
export function isProviderSupported(provider: VideoProvider): boolean {
  return provider === 'youtube' || provider === 'vimeo'
}
