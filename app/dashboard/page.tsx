"use client";
import { useState, useEffect } from 'react';
import { videos, isVideoAvailable } from '@/data/videos';
import { Lock, PlayCircle, Calendar } from 'lucide-react';
import { ProgressBar, MarkCompleteButton, CompletedBadge } from '@/components/progress-tracker';

export interface VideoCourse {
  id: string
  title: string
  description: string
  vdoCipherVideoId?: string
  vimeoVideoId?: string
  availableAt: string
  duration: string
  week: number
  resources?: { label: string; url: string }[]
}

export default function DashboardPage() {
  const [nextLesson, setNextLesson] = useState<VideoCourse | null>(null);

  async function fetchNextLesson() {
    try {
      const response = await fetch('/api/progress');
      if (response.ok) {
        const data = await response.json();
        // Find the first available video that hasn't been completed
        const availableVideos = videos.filter(isVideoAvailable);
        const completedVideoIds = data.completedLessons || [];
        const nextVideo = availableVideos.find(v => !completedVideoIds.includes(v.id));
        setNextLesson(nextVideo || null);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch next lesson:', error);
    }
  }

  useEffect(() => {
    fetchNextLesson();
  }, []);

  const formatAvailableDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const weeks = Array.from(new Set(videos.map((v) => v.week))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          My Learning
        </h1>
        <p className="text-neutral-600">
          Your enrolled courses and video content
        </p>
      </div>

      {/* Continue Learning */}
      {nextLesson && (
        <div className="p-6 bg-gray-100 border border-neutral-200 rounded-lg">
          <div className="flex items-start gap-4">
            <PlayCircle className="h-8 w-8 text-sky-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 mb-2">Continue Learning</h3>
              <p className="text-sm text-neutral-600 mb-3">
                Next Lesson: <span className="font-medium">{nextLesson.title}</span>
              </p>
              <a
                href={`/dashboard/video/${nextLesson.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-neutral-900 text-sm font-medium rounded hover:bg-sky-700 transition-colors"
              >
                <PlayCircle className="h-4 w-4" />
                Watch Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <ProgressBar totalVideos={videos.filter(isVideoAvailable).length} />

      {/* Course Videos */}
      <div className="space-y-12">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Your Curriculum
          </h2>
          <p className="text-sm text-neutral-600">
            Videos are released every Monday, Wednesday, and Friday. Complete each session to stay on track.
          </p>
        </div>

        {weeks.map((week) => (
          <section key={week}>
            <h2 className="mb-6 pb-2 border-b border-neutral-200 font-semibold text-lg text-neutral-900">
              Week {week}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos
                .filter((v) => v.week === week)
                .map((video) => {
                  const available = isVideoAvailable(video);
                  return (
                    <div
                      key={video.id}
                      className={`group relative flex flex-col overflow-hidden border rounded-lg ${
                        available
                          ? 'border-neutral-200 bg-gray-100 hover:border-sky-300'
                          : 'border-neutral-100 bg-neutral-50 opacity-60'
                      } transition-colors`}
                    >
                      {/* Completed badge */}
                      {available && <CompletedBadge videoId={video.id} />}
                      <div className="aspect-video w-full bg-neutral-100 p-4 flex items-center justify-center relative">
                        {available ? (
                          <PlayCircle className="h-12 w-12 text-sky-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <Lock className="h-10 w-10 text-neutral-400" />
                        )}
                        <div className="absolute top-2 right-2 rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-900 backdrop-blur">
                          {video.duration}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className={`font-semibold ${available ? 'text-neutral-900' : 'text-neutral-600'}`}>
                          {video.title}
                        </h3>
                        <p className="mt-2 text-sm text-neutral-500 line-clamp-2 mb-4">
                          {video.description}
                        </p>
                        {available ? (
                          <div className="mt-auto flex items-center justify-between">
                            <a
                              href={`/dashboard/video/${video.id}`}
                              className="inline-flex items-center justify-center border border-sky-600 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 rounded hover:bg-sky-600 hover:text-neutral-900 transition-colors"
                            >
                              Watch Session
                            </a>
                            <MarkCompleteButton videoId={video.id} />
                          </div>
                        ) : (
                          <div className="mt-auto flex items-center gap-2 border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs text-neutral-500 rounded">
                            <Calendar className="h-3 w-3" /> Unlocks {formatAvailableDate(video.availableAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}