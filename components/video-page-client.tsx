'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Download, Clock, BookOpen, FileText, ClipboardCheck, Star } from 'lucide-react'
import VideoPlayer from '@/components/video-player'
import CourseReviewModal from '@/components/CourseReviewModal'

export default function VideoPageClient({ 
  lesson, 
  nextLessonId, 
  resumeFromSeconds,
  resources,
  quizzes,
  assignments,
  backUrl,
  backLabel,
  courseId,
  courseTitle
}: {
  lesson: any,
  nextLessonId: string | null,
  resumeFromSeconds: number,
  resources: any[],
  quizzes: any[],
  assignments: any[],
  backUrl: string,
  backLabel: string,
  courseId?: string,
  courseTitle?: string
}) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const effectiveCourseId = courseId || lesson?.product_id || ''
  const effectiveCourseTitle = courseTitle || 'Course'

  const handleComplete = () => {
    if (!isCompleted) {
      setIsCompleted(true)
      
      // Check if student has already reviewed or dismissed prompt recently
      if (effectiveCourseId) {
        try {
          const alreadyReviewed = localStorage.getItem(`course_reviewed_${effectiveCourseId}`)
          const dismissedAt = localStorage.getItem(`review_prompt_dismissed_${effectiveCourseId}`)
          const now = Date.now()
          const dismissedRecently = dismissedAt && (now - parseInt(dismissedAt, 10)) < 1000 * 60 * 60 * 24 // 24hr cooldown

          if (!alreadyReviewed && !dismissedRecently) {
            setTimeout(() => {
              setShowReviewModal(true)
            }, 1200)
          }
        } catch (e) {
          // ignore localStorage error
        }
      }
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6">
        <Link
          href={backUrl}
          className="flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        {isCompleted && nextLessonId && (
          <Link
            href={`/dashboard/video/${nextLessonId}`}
            className="flex items-center gap-2 text-sm font-medium text-[#10b981] transition hover:text-[#0ea5e9]"
          >
            Next Lesson
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 pb-20">
        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                <Clock className="h-3.5 w-3.5" />
                {lesson.duration_label || 'Video Lesson'}
              </span>
              {lesson.week_number && lesson.week_number > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                  <BookOpen className="h-3.5 w-3.5" />
                  Week {lesson.week_number}
                </span>
              )}
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            {lesson.title}
          </h1>
          <p className="mt-3 text-base text-neutral-600 leading-relaxed max-w-3xl">
            {lesson.description || 'No description provided.'}
          </p>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-lg" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
          <VideoPlayer
            lessonId={lesson.uuid_id || lesson.id}
            youtubeVideoId={lesson.youtube_video_id}
            vimeoVideoId={lesson.vimeo_video_id}
            vdoCipherVideoId={lesson.vdo_cipher_video_id}
            resumeFromSeconds={resumeFromSeconds}
            onComplete={handleComplete}
          />
        </div>
        
        {isCompleted && nextLessonId && (
          <div className="mt-6 flex justify-end">
            <Link
              href={`/dashboard/video/${nextLessonId}`}
              className="inline-flex items-center gap-2 bg-[#10b981] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0ea5e9] transition-colors shadow-sm"
            >
              Continue to Next Lesson
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
        
        {isCompleted && !nextLessonId && (
          <div className="mt-6 flex justify-end">
            <Link
              href={backUrl}
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Back to Course Overview
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
        )}

        {/* Resources Section */}
        {resources && resources.length > 0 && (
          <div className="mt-12 border border-neutral-200 bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Download className="h-5 w-5 text-[#10b981]" />
              Session Resources
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50 hover:border-[#10b981] hover:shadow-md transition-all group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-600 group-hover:text-[#10b981] group-hover:shadow-sm transition-all border border-neutral-100">
                    <Download className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-neutral-900 group-hover:text-[#10b981] transition-colors">
                    {resource.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quizzes Section */}
        {quizzes && quizzes.length > 0 && (
          <div className="mt-8 border border-neutral-200 bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-neutral-900 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#10b981]" />
              Quiz
            </h2>
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-neutral-200 bg-neutral-50"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="mt-1 text-sm text-neutral-600">{quiz.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500 font-medium">
                      {quiz.time_limit && (
                        <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-neutral-200">
                          <Clock className="h-3.5 w-3.5" />
                          {quiz.time_limit} minutes
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-neutral-200">
                        Pass mark: {quiz.passing_score}%
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-[#10b981] transition-colors shadow-sm"
                  >
                    Take Quiz
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Section */}
        {assignments && assignments.length > 0 && (
          <div className="mt-8 border border-neutral-200 bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-neutral-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#10b981]" />
              Assignment
            </h2>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-neutral-200 bg-neutral-50"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="mt-1 text-sm text-neutral-600">{assignment.description}</p>
                    )}
                    {assignment.due_date && (
                      <p className="mt-3 text-xs text-neutral-500 font-medium inline-flex bg-white px-2 py-1 rounded-md border border-neutral-200">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/assignments?assignment=${assignment.id}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-[#10b981] transition-colors shadow-sm"
                  >
                    View Assignment
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Rate Course Action */}
        {effectiveCourseId && (
          <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Enjoying the course?
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                Share your review and rating to help other students on AutoLearn Spot.
              </p>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors shrink-0"
            >
              Write a Review
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <CourseReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          courseId={effectiveCourseId}
          courseTitle={effectiveCourseTitle}
          lessonId={lesson?.uuid_id || lesson?.id}
          lessonTitle={lesson?.title}
        />
      )}
    </main>
  )
}
