"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink, 
  PlayCircle, 
  X, 
  ChevronRight, 
  TrendingUp, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface LessonDetail {
  id: string;
  uuid_id?: string;
  title: string;
  order_index: number;
  completed: boolean;
  watch_pct: number;
  last_active: string | null;
}

interface StudentActivity {
  id: string;
  student_name: string;
  student_email: string;
  clerk_user_id: string | null;
  course_id: string;
  course_title: string;
  course_thumbnail: string | null;
  enrollment_status: string;
  enrolled_at: string;
  activated_at: string | null;
  latest_active_at: string;
  learning_status: 'not_started' | 'in_progress' | 'completed';
  progress_pct: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  current_lesson_title: string;
  certificate_earned: boolean;
  certificate: {
    id: string;
    code: string;
    issued_at: string;
    verify_url: string;
  } | null;
  lessons: LessonDetail[];
}

interface ActivityMetrics {
  totalEnrollments: number;
  uniqueStudents: number;
  startedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completedCount: number;
  certifiedCount: number;
  averageProgress: number;
}

export default function AdminStudentActivitiesPage() {
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [metrics, setMetrics] = useState<ActivityMetrics>({
    totalEnrollments: 0,
    uniqueStudents: 0,
    startedCount: 0,
    inProgressCount: 0,
    notStartedCount: 0,
    completedCount: 0,
    certifiedCount: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'certified' | 'not_started'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentActivity | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/students/activities');
      if (res.ok) {
        const json = await res.json();
        setActivities(json.activities || []);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch (err) {
      console.error('Error fetching student activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Unique course titles for filter dropdown
  const uniqueCourses = Array.from(new Set(activities.map(a => a.course_title).filter(Boolean)));

  // Filter activities
  const filteredActivities = activities.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = 
      (a.student_name && a.student_name.toLowerCase().includes(q)) ||
      (a.student_email && a.student_email.toLowerCase().includes(q)) ||
      (a.course_title && a.course_title.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (courseFilter !== 'all' && a.course_title !== courseFilter) {
      return false;
    }

    if (statusFilter === 'certified') {
      return a.certificate_earned;
    } else if (statusFilter !== 'all') {
      return a.learning_status === statusFilter;
    }

    return true;
  });

  return (
    <div className="min-h-screen p-6 sm:p-8 text-brand-text bg-brand-bg space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Student Activities &amp; Progress</h1>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/20">
              Live Monitoring
            </span>
          </div>
          <p className="text-sm text-brand-text/60 mt-1">
            Real-time tracking of course starts, lesson completions, progress percentages, and earned certificates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/students"
            className="px-4 py-2 border border-border/80 rounded-xl text-xs font-semibold hover:bg-[var(--card)] transition-colors"
          >
            Product Purchasers
          </Link>
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="p-2 border border-border/80 rounded-xl hover:bg-[var(--card)] text-brand-text/70 hover:text-foreground transition-colors"
            title="Refresh Activities"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{metrics.totalEnrollments}</p>
          <p className="text-xs text-brand-text/50 mt-1">{metrics.uniqueStudents} unique students</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider">Started Course</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-600">{metrics.startedCount}</p>
          <p className="text-xs text-sky-600/80 mt-1">
            {metrics.totalEnrollments > 0 ? Math.round((metrics.startedCount / metrics.totalEnrollments) * 100) : 0}% activation rate
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider">In Progress</span>
            <PlayCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{metrics.inProgressCount}</p>
          <p className="text-xs text-amber-600/80 mt-1">Active learners</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider">Course Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{metrics.completedCount}</p>
          <p className="text-xs text-emerald-600/80 mt-1">100% lessons finished</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider">Certified</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600">{metrics.certifiedCount}</p>
          <p className="text-xs text-purple-600/80 mt-1">Official certificates issued</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--card)] p-4 rounded-2xl border border-border/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
          <input
            type="text"
            placeholder="Search by student name, email, or course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-brand-bg border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Course dropdown */}
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="px-3 py-2 bg-brand-bg border border-border/80 rounded-xl text-xs font-semibold focus:outline-none text-foreground"
          >
            <option value="all">All Courses</option>
            {uniqueCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-brand-bg p-1 rounded-xl border border-border/80 overflow-x-auto">
            {(['all', 'in_progress', 'completed', 'certified', 'not_started'] as const).map(tab => {
              const labels: Record<string, string> = {
                all: 'All',
                in_progress: 'In Progress',
                completed: 'Completed',
                certified: 'Certified',
                not_started: 'Not Started',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-[var(--card)] text-foreground shadow-sm font-bold'
                      : 'text-brand-text/60 hover:text-foreground'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-[var(--card)] rounded-2xl border border-border/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/80 text-brand-text/60 bg-muted/20">
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Student</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Course</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Course Progress</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Current Lesson</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Last Active</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Certificate</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-brand-text/50">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading student activities...
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-brand-text/50">
                    <BookOpen className="w-10 h-10 text-brand-text/20 mx-auto mb-2" />
                    <p className="font-semibold text-foreground">No student activities found</p>
                    <p className="text-xs mt-1">Adjust search or filters to see student progress.</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map(act => (
                  <tr key={act.id} className="hover:bg-muted/10 transition-colors">
                    {/* Student Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {act.student_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{act.student_name}</p>
                          <p className="text-xs text-brand-text/60 truncate">{act.student_email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="p-4">
                      <span className="font-medium text-foreground text-xs block max-w-[180px] truncate" title={act.course_title}>
                        {act.course_title}
                      </span>
                      <span className="text-[10px] text-brand-text/50">
                        {act.total_lessons_count} total lessons
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="p-4 min-w-[170px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground">{act.progress_pct}%</span>
                          <span className="text-[11px] text-brand-text/60">
                            {act.completed_lessons_count}/{act.total_lessons_count} done
                          </span>
                        </div>
                        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              act.progress_pct === 100 
                                ? 'bg-emerald-500' 
                                : act.progress_pct > 0 
                                  ? 'bg-sky-500' 
                                  : 'bg-gray-300'
                            }`}
                            style={{ width: `${act.progress_pct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold uppercase inline-block px-1.5 py-0.2 rounded ${
                          act.learning_status === 'completed' 
                            ? 'text-emerald-600 bg-emerald-50' 
                            : act.learning_status === 'in_progress' 
                              ? 'text-sky-600 bg-sky-50' 
                              : 'text-gray-500 bg-gray-100'
                        }`}>
                          {act.learning_status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>

                    {/* Current Lesson */}
                    <td className="p-4">
                      <div className="max-w-[200px]">
                        <p className="text-xs font-medium text-foreground truncate" title={act.current_lesson_title}>
                          {act.current_lesson_title}
                        </p>
                        <span className="text-[10px] text-brand-text/50 flex items-center gap-1 mt-0.5">
                          <PlayCircle className="w-3 h-3" /> Last position tracked
                        </span>
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="p-4 text-xs text-brand-text/70 whitespace-nowrap">
                      {act.latest_active_at ? (
                        <>
                          <div>{new Date(act.latest_active_at).toLocaleDateString()}</div>
                          <div className="text-[10px] text-brand-text/40">{new Date(act.latest_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : (
                        'Never'
                      )}
                    </td>

                    {/* Certificate */}
                    <td className="p-4">
                      {act.certificate ? (
                        <Link
                          href={act.certificate.verify_url}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors group"
                        >
                          <Award className="w-3.5 h-3.5 text-purple-600" />
                          <span>{act.certificate.code}</span>
                          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        </Link>
                      ) : (
                        <span className="text-xs text-brand-text/40 italic">
                          {act.progress_pct >= 100 ? 'Eligible' : 'In Progress'}
                        </span>
                      )}
                    </td>

                    {/* Details Action */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(act)}
                        className="px-3 py-1.5 bg-muted/60 hover:bg-brand-primary hover:text-white text-xs font-semibold rounded-lg transition-colors border border-border/80"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Student Activity Drawer / Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-gray-900 max-h-[90vh] flex flex-col relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-base">
                  {selectedStudent.student_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedStudent.student_name}</h3>
                  <p className="text-xs text-gray-500">{selectedStudent.student_email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Course</span>
                  <span className="text-xs font-bold text-gray-900 truncate block">{selectedStudent.course_title}</span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Overall Progress</span>
                  <span className="text-xs font-bold text-emerald-600 block">
                    {selectedStudent.progress_pct}% ({selectedStudent.completed_lessons_count}/{selectedStudent.total_lessons_count})
                  </span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Enrolled Date</span>
                  <span className="text-xs font-bold text-gray-900 block">
                    {new Date(selectedStudent.enrolled_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Certificate</span>
                  <span className="text-xs font-bold text-purple-600 block">
                    {selectedStudent.certificate ? selectedStudent.certificate.code : 'Not earned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lessons Breakdown List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Lesson-by-Lesson Progress Breakdown
              </h4>

              {selectedStudent.lessons.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No lessons found for this course curriculum.</p>
              ) : (
                selectedStudent.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id || idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      lesson.completed 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : lesson.watch_pct > 0 
                          ? 'bg-sky-50/50 border-sky-200' 
                          : 'bg-gray-50/50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        lesson.completed 
                          ? 'bg-emerald-500 text-white' 
                          : lesson.watch_pct > 0 
                            ? 'bg-sky-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {lesson.completed ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${lesson.completed ? 'text-emerald-950' : 'text-gray-900'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {lesson.last_active 
                            ? `Last watched: ${new Date(lesson.last_active).toLocaleDateString()} at ${new Date(lesson.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                            : 'Not yet started'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        lesson.completed 
                          ? 'text-emerald-700 bg-emerald-100' 
                          : lesson.watch_pct > 0 
                            ? 'text-sky-700 bg-sky-100' 
                            : 'text-gray-400 bg-gray-100'
                      }`}>
                        {lesson.completed ? 'Completed (100%)' : `${lesson.watch_pct}% watched`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
              {selectedStudent.certificate ? (
                <Link
                  href={selectedStudent.certificate.verify_url}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-800"
                >
                  <Award className="w-4 h-4" />
                  View Earned Certificate ({selectedStudent.certificate.code})
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-xs text-gray-400">Certificate not yet issued</span>
              )}
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
