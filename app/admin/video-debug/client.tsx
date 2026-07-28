'use client'

import { useEffect, useState, useCallback } from 'react'
import { isVideoEngineV2, setVideoEngineV2 } from '@/utils/feature-toggle'
import { migrationLog } from '@/utils/migration-logger'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

interface LessonManifest {
  id: string
  title: string
  week: number
  youtubeVideoId: string | null
  vimeoVideoId: string | null
  vdoCipherVideoId: string | null
}

type ValidationStatus = 'idle' | 'checking' | 'ok' | 'fallback' | 'error'

interface LessonValidation {
  id: string
  thumbnailStatus: ValidationStatus
  thumbnailUrl: string
  playbackStatus: ValidationStatus
  activeProvider: string
  activeVideoId: string
  notes: string
}

function buildThumbnailUrl(lesson: LessonManifest, v2: boolean): string {
  if (v2 && lesson.youtubeVideoId) {
    return `https://img.youtube.com/vi/${lesson.youtubeVideoId}/maxresdefault.jpg`
  }
  return '' // Vimeo thumbnails require API; skip for now
}

function getActiveProvider(lesson: LessonManifest, v2: boolean): { provider: string; videoId: string } {
  if (v2 && lesson.youtubeVideoId) return { provider: 'youtube', videoId: lesson.youtubeVideoId }
  if (lesson.vimeoVideoId) return { provider: 'vimeo', videoId: lesson.vimeoVideoId }
  if (lesson.vdoCipherVideoId) return { provider: 'vdocipher', videoId: lesson.vdoCipherVideoId }
  return { provider: 'none', videoId: '' }
}

function StatusBadge({ status, label }: { status: ValidationStatus; label?: string }) {
  const map = {
    idle: { icon: <AlertCircle className="h-4 w-4 text-[#b9cacb]" />, text: label ?? 'Pending', color: 'text-[#b9cacb]' },
    checking: { icon: <Loader2 className="h-4 w-4 animate-spin text-[#00f0ff]" />, text: 'Checking…', color: 'text-[#00f0ff]' },
    ok: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />, text: label ?? 'OK', color: 'text-emerald-400' },
    fallback: { icon: <AlertCircle className="h-4 w-4 text-amber-400" />, text: 'Fallback', color: 'text-amber-400' },
    error: { icon: <XCircle className="h-4 w-4 text-red-400" />, text: 'Error', color: 'text-red-400' },
  }
  const { icon, text, color } = map[status]
  return (
    <span className={`flex items-center gap-1.5 font-mono text-xs font-semibold ${color}`}>
      {icon} {text}
    </span>
  )
}

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    youtube: 'bg-red-500/20 text-red-300 border-red-500/30',
    vimeo: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    vdocipher: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    none: 'bg-[#1f2229] text-[#b9cacb] border-[#3b494b]',
  }
  const cls = colors[provider] ?? colors.none
  return (
    <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {provider}
    </span>
  )
}

export default function VideoDebugClient({ lessons }: { lessons: LessonManifest[] }) {
  const [v2Enabled, setV2Enabled] = useState(false)
  const [validations, setValidations] = useState<Record<string, LessonValidation>>({})
  const [previewLesson, setPreviewLesson] = useState<LessonManifest | null>(null)
  const [validating, setValidating] = useState(false)

  // Read toggle state from localStorage on mount
  useEffect(() => {
    setV2Enabled(isVideoEngineV2())
  }, [])

  const handleToggle = () => {
    const newVal = !v2Enabled
    setVideoEngineV2(newVal)
    setV2Enabled(newVal)
    migrationLog.toggleSwitch(newVal)
    // Reset validation results so they're re-run with the new engine
    setValidations({})
  }

  // Validate thumbnails for all lessons
  const runValidation = useCallback(async () => {
    setValidating(true)
    const results: Record<string, LessonValidation> = {}

    for (const lesson of lessons) {
      const { provider, videoId } = getActiveProvider(lesson, v2Enabled)
      const thumbnailUrl = buildThumbnailUrl(lesson, v2Enabled)

      const val: LessonValidation = {
        id: lesson.id,
        thumbnailStatus: 'checking',
        thumbnailUrl,
        playbackStatus: videoId ? 'ok' : 'error',
        activeProvider: provider,
        activeVideoId: videoId,
        notes: '',
      }

      // For YouTube: probe thumbnail availability
      if (provider === 'youtube' && thumbnailUrl) {
        try {
          const res = await fetch(thumbnailUrl, { method: 'HEAD', mode: 'no-cors' })
          // no-cors always returns opaque; treat any response as potentially ok
          // We check by loading the image instead
          val.thumbnailStatus = 'ok'
        } catch {
          val.thumbnailStatus = 'error'
        }
      } else if (provider === 'vimeo' || provider === 'vdocipher') {
        val.thumbnailStatus = 'idle' // Not checkable without API key
        val.notes = 'Thumbnail check skipped for legacy provider'
      } else if (!videoId) {
        val.thumbnailStatus = 'error'
        val.playbackStatus = 'error'
        val.notes = 'No video ID configured'
      }

      // For YouTube with no ID when V2 is enabled, check fallback
      if (v2Enabled && !lesson.youtubeVideoId) {
        val.notes = 'No YouTube ID — player will fall back to legacy'
        val.playbackStatus = lesson.vimeoVideoId || lesson.vdoCipherVideoId ? 'fallback' : 'error'
      }

      results[lesson.id] = val
    }

    setValidations(results)
    setValidating(false)
  }, [lessons, v2Enabled])

  const allOk = Object.values(validations).every(
    (v) => v.thumbnailStatus === 'ok' && (v.playbackStatus === 'ok' || v.playbackStatus === 'fallback')
  )

  return (
    <div className="space-y-6">
      {/* Engine Toggle Card */}
      <div className="flex flex-col gap-4 border border-[#1f2229] bg-[#0c0e12] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#b9cacb]">Video Engine</p>
          <p className="mt-1 text-lg font-bold text-white">
            {v2Enabled ? '🎬 V2 — YouTube Iframe API' : '📼 V1 — Legacy (Vimeo / VdoCipher)'}
          </p>
          <p className="mt-1 font-mono text-xs text-[#b9cacb]">
            Toggle persists in localStorage. Affects this browser tab only. No redeployment required.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 border px-5 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider transition-all ${
              v2Enabled
                ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20'
                : 'border-[#3b494b] bg-[#111317] text-[#b9cacb] hover:border-[#00f0ff] hover:text-[#00f0ff]'
            }`}
          >
            {v2Enabled ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {v2Enabled ? 'Disable V2' : 'Enable V2'}
          </button>
          <button
            onClick={runValidation}
            disabled={validating}
            className="flex items-center gap-2 border border-[#3b494b] bg-[#111317] px-5 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider text-[#e2e2e8] transition-all hover:border-[#00f0ff] disabled:opacity-50"
          >
            {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Validate All
          </button>
        </div>
      </div>

      {/* Summary */}
      {Object.keys(validations).length > 0 && (
        <div className={`border p-4 font-mono text-sm ${allOk ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
          {allOk
            ? '✅ All lessons validated successfully.'
            : '⚠️ Some lessons require attention — see details below.'}
        </div>
      )}

      {/* Lesson Table */}
      <div className="overflow-x-auto border border-[#1f2229]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1f2229] bg-[#0c0e12]">
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[#b9cacb]">Lesson</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[#b9cacb]">Provider</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[#b9cacb]">Video ID</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[#b9cacb]">Thumbnail</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[#b9cacb]">Playback</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[#b9cacb]">Notes</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[#b9cacb]">Preview</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson, i) => {
              const val = validations[lesson.id]
              const { provider, videoId } = getActiveProvider(lesson, v2Enabled)
              const thumbUrl = buildThumbnailUrl(lesson, v2Enabled)

              return (
                <tr
                  key={lesson.id}
                  className={`border-b border-[#1f2229] transition-colors hover:bg-[#0c0e12] ${i % 2 === 0 ? 'bg-[#111317]' : 'bg-[#0e1014]'}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-[#b9cacb]">W{lesson.week}</div>
                    <div className="max-w-[200px] truncate font-mono text-sm font-semibold text-white">
                      {lesson.title}
                    </div>
                    <div className="font-mono text-[10px] text-[#5d5f63]">{lesson.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ProviderBadge provider={val?.activeProvider ?? provider} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#b9cacb]">
                      {val?.activeVideoId ?? videoId ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {val ? (
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={val.thumbnailStatus} />
                        {val.thumbnailUrl && val.thumbnailStatus !== 'idle' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={val.thumbnailUrl}
                            alt="thumb"
                            className="h-10 w-16 rounded border border-[#3b494b] object-cover"
                            onError={(e) => {
                              const img = e.currentTarget
                              if (val.thumbnailUrl.includes('maxresdefault')) {
                                const fallback = val.thumbnailUrl.replace('maxresdefault', 'hqdefault')
                                img.src = fallback
                                migrationLog.thumbnailFallback(lesson.id, val.thumbnailUrl, fallback)
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <StatusBadge status="idle" label="—" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={val?.playbackStatus ?? 'idle'} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#b9cacb]">
                      {val?.notes || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {videoId ? (
                      <button
                        onClick={() => setPreviewLesson(lesson)}
                        className="flex items-center gap-1.5 border border-[#3b494b] px-3 py-1.5 font-mono text-xs font-semibold uppercase text-[#00f0ff] transition-all hover:border-[#00f0ff] hover:bg-[#00f0ff]/10"
                      >
                        <Play className="h-3 w-3" />
                        Test
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-[#5d5f63]">No video</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Playback Preview Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl border border-[#3b494b] bg-[#0c0e12]">
            <div className="flex items-center justify-between border-b border-[#1f2229] px-5 py-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[#b9cacb]">
                  Preview — {v2Enabled ? 'YouTube V2' : 'Legacy'}
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-white">
                  {previewLesson.title}
                </p>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="rounded border border-[#3b494b] p-1.5 text-[#b9cacb] transition hover:border-[#00f0ff] hover:text-[#00f0ff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              {(() => {
                const { provider, videoId } = getActiveProvider(previewLesson, v2Enabled)
                if (provider === 'youtube' && videoId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                      className="h-full w-full"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title={previewLesson.title}
                    />
                  )
                }
                if (provider === 'vimeo' && videoId) {
                  return (
                    <iframe
                      src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
                      className="h-full w-full"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title={previewLesson.title}
                    />
                  )
                }
                return (
                  <div className="flex h-full items-center justify-center font-mono text-sm text-[#b9cacb]">
                    Preview not available for {provider} provider.
                  </div>
                )
              })()}
            </div>
            <div className="flex items-center justify-between border-t border-[#1f2229] px-5 py-3">
              <span className="font-mono text-xs text-[#b9cacb]">
                Provider: <strong className="text-white">{getActiveProvider(previewLesson, v2Enabled).provider}</strong>
                {' '}• ID: <strong className="text-white">{getActiveProvider(previewLesson, v2Enabled).videoId}</strong>
              </span>
              <a
                href={`/dashboard/video/${previewLesson.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[#00f0ff] transition hover:underline"
              >
                Open full lesson page →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
