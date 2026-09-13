"use client";
import { useState, useEffect } from 'react';
import { videos, isVideoAvailable } from '@/data/videos';
import { Lock, Play, PlayCircle, Calendar, BookOpen, Clock } from 'lucide-react';
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
    <div className="space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-neutral-900 mb-2 tracking-tight">
            My Learning
          </h1>
          <p className="text-lg text-neutral-500">
            Pick up right where you left off.
          </p>
        </div>
      </div>

      {/* Continue Learning Card */}
      {nextLesson && (
        <div className="relative overflow-hidden bg-white border border-neutral-200/60 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100/50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm text-[#10b981]">
                <PlayCircle className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col justify-center h-16">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-1">Continue Learning</h3>
                <p className="text-xl font-bold text-neutral-900 line-clamp-1">{nextLesson.title}</p>
              </div>
            </div>
            
            <a
              href={`/dashboard/video/${nextLesson.id}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
            >
              Resume Lesson
              <Play className="h-4 w-4 fill-current" />
            </a>
          </div>
        </div>
      )}

      {/* Progress */}
      <ProgressBar totalVideos={videos.filter(isVideoAvailable).length} />

      {/* Course Videos */}
      <div className="space-y-12 pt-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2 tracking-tight">
            Your Curriculum
          </h2>
          <p className="text-neutral-500 max-w-2xl">
            Videos are released every Monday, Wednesday, and Friday. Complete each session to stay on track.
          </p>
        </div>

        {weeks.map((week) => (
          <section key={week} className="scroll-mt-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-heading font-bold text-xl text-neutral-900">
                Week {week}
              </h2>
              <div className="h-px bg-neutral-200 flex-1" />
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos
                .filter((v) => v.week === week)
                .map((video) => {
                  const available = isVideoAvailable(video);
                  return (
                    <div
                      key={video.id}
                      className={`group relative flex flex-col overflow-hidden rounded-[20px] bg-white border border-neutral-200/60 ${
                        available
                          ? 'hover:border-[#10b981]/40 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                          : 'opacity-75 grayscale-[0.5]'
                      } transition-all duration-300`}
                    >
                      {/* Completed badge */}
                      {available && <CompletedBadge videoId={video.id} />}
                      
                      <a 
                        href={available ? `/dashboard/video/${video.id}` : '#'} 
                        className={`block aspect-video w-full relative overflow-hidden bg-slate-50 border-b border-neutral-100 ${!available && 'cursor-not-allowed'}`}
                      >
                        {/* Placeholder graphic (subtle pattern) */}
                        <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJ6IiBmaWxsPSIjMDAwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')]" />
                        
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          {available ? (
                            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-[#10b981] opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                              <Play className="h-5 w-5 ml-1 fill-current" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-neutral-100/80 backdrop-blur-sm border border-neutral-200/50 flex items-center justify-center text-neutral-400">
                              <Lock className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-3 right-3 rounded-lg bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white flex items-center gap-1.5 z-10">
                          <Clock className="w-3 h-3 opacity-70" />
                          {video.duration}
                        </div>
                      </a>

                      <div className="flex flex-1 flex-col p-5">
                        <a href={available ? `/dashboard/video/${video.id}` : '#'} className={!available ? 'cursor-not-allowed pointer-events-none' : ''}>
                          <h3 className={`font-heading font-bold text-lg leading-tight mb-2 group-hover:text-[#10b981] transition-colors ${available ? 'text-neutral-900' : 'text-neutral-600'}`}>
                            {video.title}
                          </h3>
                        </a>
                        
                        <p className="text-sm text-neutral-500 line-clamp-2 mb-5 leading-relaxed flex-1">
                          {video.description}
                        </p>
                        
                        {available ? (
                          <div className="mt-auto flex items-center justify-between gap-3">
                            <a
                              href={`/dashboard/video/${video.id}`}
                              className="flex-1 inline-flex items-center justify-center bg-white border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
                            >
                              Watch
                            </a>
                            <MarkCompleteButton videoId={video.id} />
                          </div>
                        ) : (
                          <div className="mt-auto flex items-center justify-center gap-2 border border-neutral-200/60 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-500 rounded-xl">
                            <Calendar className="h-3.5 w-3.5 opacity-70" /> Unlocks {formatAvailableDate(video.availableAt)}
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
