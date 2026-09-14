'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCw } from 'lucide-react';

interface PremiumVideoPlayerProps {
  youtubeVideoId: string;
  resumeFromSeconds?: number;
  className?: string;
}

export function PremiumVideoPlayer({
  youtubeVideoId,
  resumeFromSeconds = 0,
  className = '',
}: PremiumVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize YouTube Player
  useEffect(() => {
    if (!window.YT) {
      // Load YouTube IFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      tag.onload = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [youtubeVideoId]);

  const initializePlayer = () => {
    if (!window.YT || !containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        disablekb: 1,
        fs: 0,
        start: resumeFromSeconds,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onTimeUpdate: onPlayerTimeUpdate,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    setDuration(event.target.getDuration());
    updateProgress();
  };

  const onPlayerStateChange = (event: any) => {
    setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
  };

  const onPlayerTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.getCurrentTime());
    }
  };

  const updateProgress = useCallback(() => {
    if (playerRef.current && isPlaying) {
      setCurrentTime(playerRef.current.getCurrentTime());
      requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
        playerRef.current.unMute();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseInt(e.target.value) / 100) * duration;
    if (playerRef.current) {
      playerRef.current.seekTo(seekTime, true);
      setCurrentTime(seekTime);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Double-tap gestures
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = (side: 'left' | 'right') => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap detected
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        if (side === 'left') {
          playerRef.current.seekTo(Math.max(0, currentTime - 10), true);
        } else {
          playerRef.current.seekTo(Math.min(duration, currentTime + 10), true);
        }
      }
    }
    setLastTap(now);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const width = rect.width;

    // Left 30% - rewind
    if (x < width * 0.3) {
      handleDoubleTap('left');
    }
    // Right 30% - fast forward
    else if (x > width * 0.7) {
      handleDoubleTap('right');
    }
    // Center - play/pause
    else {
      togglePlay();
    }
  };

  // Block right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video bg-black overflow-hidden ${className}`}
      onClick={handleContainerClick}
      onContextMenu={handleContextMenu}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube IFrame will be mounted here */}
      <div id={`youtube-player-${youtubeVideoId}`} className="w-full h-full" />

      {/* Double-tap indicators */}
      <div className="absolute inset-0 pointer-events-none flex justify-between px-8">
        <div className="w-1/3 h-full flex items-center justify-start">
          <div className="opacity-0 transition-opacity duration-200" id="rewind-indicator">
            <div className="bg-black/70 text-white p-4 rounded-full backdrop-blur-sm">
              <RotateCw className="w-8 h-8 rotate-180" />
              <span className="text-sm font-bold">-10s</span>
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full flex items-center justify-end">
          <div className="opacity-0 transition-opacity duration-200" id="forward-indicator">
            <div className="bg-black/70 text-white p-4 rounded-full backdrop-blur-sm">
              <RotateCw className="w-8 h-8" />
              <span className="text-sm font-bold">+10s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercent}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <Maximize className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
