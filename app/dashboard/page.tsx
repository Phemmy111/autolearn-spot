"use client";
import { useState, useEffect } from 'react';
import { Lock, Play, BookOpen, Clock, Calendar, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Course {
  enrollment_id: string;
  enrolled_at: string | null; // activated_at
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail_url: string;
    product_type: string;
    access_duration_days: number;
  };
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/dashboard/courses');
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        setCourses(data.courses || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const startCourse = async (enrollmentId: string) => {
    try {
      const res = await fetch(`/api/dashboard/courses/${enrollmentId}/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start course');
      const data = await res.json();
      
      setCourses(courses.map(c => 
        c.enrollment_id === enrollmentId ? { ...c, enrolled_at: data.activated_at } : c
      ));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const calculateDaysLeft = (activatedAt: string, durationDays: number) => {
    const activatedTime = new Date(activatedAt).getTime();
    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    
    if (now > activatedTime + durationMs) return 0;
    return Math.ceil((activatedTime + durationMs - now) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="p-8 text-brand-text">Loading your courses...</div>;
  }

  if (error) {
    return <div className="p-8 text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text mb-2 tracking-tight">
            My Courses
          </h1>
          <p className="text-lg text-brand-text/60">
            Pick up right where you left off.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {courses.map((c) => {
          const isStarted = !!c.enrolled_at;
          const daysLeft = isStarted ? calculateDaysLeft(c.enrolled_at!, c.course.access_duration_days) : null;
          const progressPercent = isStarted ? 
            Math.max(0, Math.min(100, 100 - (daysLeft! / c.course.access_duration_days) * 100)) : 0;

          return (
            <div
              key={c.enrollment_id}
              className="group relative flex flex-col overflow-hidden rounded-[20px] bg-[var(--card)] border border-brand-border/60 hover:border-[#10b981]/40 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="block aspect-video w-full relative overflow-hidden bg-brand-bg border-b border-neutral-100">
                {c.course.thumbnail_url ? (
                  <Image src={c.course.thumbnail_url} alt={c.course.title} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJ6IiBmaWxsPSIjMDAwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')]" />
                )}
                
                <div className="absolute bottom-3 right-3 rounded-lg bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white flex items-center gap-1.5 z-10">
                  <Clock className="w-3 h-3 opacity-70" />
                  {c.course.access_duration_days} Days Access
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-heading font-bold text-lg leading-tight mb-2 text-brand-text">
                  {c.course.title}
                </h3>
                <p className="text-sm text-brand-text/60 line-clamp-2 mb-5 leading-relaxed flex-1">
                  {(() => {
                    let desc = c.course.description;
                    try {
                      if (typeof desc === 'string' && desc.startsWith('{')) {
                        const obj = JSON.parse(desc);
                        desc = obj.short_description || obj.description || desc;
                      }
                    } catch(e) {}
                    return desc;
                  })()}
                </p>
                
                {!isStarted ? (
                  <div className="mt-auto space-y-3">
                    <div className="text-xs text-brand-text/50 bg-brand-bg p-2 rounded-lg border border-brand-border/50">
                      By starting this course, your {c.course.access_duration_days}-day access will begin counting down.
                    </div>
                    <button
                      onClick={() => startCourse(c.enrollment_id)}
                      className="w-full inline-flex items-center justify-center bg-[#10b981] text-white font-bold py-2.5 rounded-xl hover:bg-[#0ea5e9] transition-all"
                    >
                      Start Course
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-brand-text/60">Access Duration</span>
                        <span className={daysLeft && daysLeft < 5 ? "text-red-500 font-bold" : "text-[#10b981]"}>{daysLeft} days left</span>
                      </div>
                      <div className="w-full bg-brand-border/30 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-[#10b981] h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <Link
                      href={`/dashboard/course/${c.course.id}`}
                      className="w-full inline-flex items-center justify-center bg-[var(--card)] border border-[#10b981]/50 px-4 py-2 text-sm font-semibold text-[#10b981] rounded-xl hover:bg-[#10b981] hover:text-white transition-all shadow-sm"
                    >
                      Continue Learning
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {courses.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-brand-border rounded-2xl">
            <BookOpen className="w-12 h-12 text-brand-text/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-brand-text mb-2">No active courses</h3>
            <p className="text-brand-text/60 mb-6 max-w-md mx-auto">
              You haven&apos;t bought any courses yet, or your access has expired.
            </p>
            <Link href="/" className="inline-flex items-center justify-center bg-[#10b981] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0ea5e9] transition-colors">
              Explore Marketplace
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
