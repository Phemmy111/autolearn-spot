/**
 * YouTube Iframe API Type Declarations
 *
 * The official @types/youtube package is available on npm but we declare
 * the minimal surface we use here to avoid adding a new dependency.
 * Only the events, player states, and methods used by youtube-player.tsx
 * are declared. Extend as needed.
 */

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerVars {
    autoplay?: 0 | 1
    controls?: 0 | 1
    modestbranding?: 0 | 1
    rel?: 0 | 1
    playsinline?: 0 | 1
    enablejsapi?: 0 | 1
    origin?: string
    start?: number
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent {
    target: Player
    data: number
  }

  interface OnErrorEvent {
    target: Player
    data: number
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: OnStateChangeEvent) => void
    onError?: (event: OnErrorEvent) => void
  }

  interface PlayerOptions {
    videoId?: string
    width?: string | number
    height?: string | number
    playerVars?: PlayerVars
    events?: Events
  }

  class Player {
    constructor(elementOrId: HTMLElement | string, options: PlayerOptions)
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
    getCurrentTime(): number
    getDuration(): number
    getPlayerState(): number
    destroy(): void
  }
}

interface Window {
  YT: typeof YT
  onYouTubeIframeAPIReady: () => void
}
