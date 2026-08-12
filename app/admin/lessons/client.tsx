'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Lock, Unlock, Save, Check, X, AlertCircle, Plus, Trash2 } from 'lucide-react'

interface Lesson {
  id: string
  cohort_id: string
  title: string
  description: string | null
  vdo_cipher_video_id: string | null
  vimeo_video_id: string | null
  available_at: string
  duration_label: string | null
  week_number: number
  session_number: number
  release_day: string
  resources: any
  order_index: number
  created_at: string
  updated_at: string
}

interface Cohort {
  id: string
  name: string
  slug: string
  status: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  timezone: string
  settings: any
}

interface ScheduleEdit {
  lessonId: string
  available_at: string
  release_day: string
}

export default function LessonSchedulerClient() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [editData, setEditData] = useState<ScheduleEdit | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null, message: string } | null>(null)

  useEffect(() => {
    fetchCohorts()
  }, [])

  useEffect(() => {
    if (selectedCohort) {
      fetchLessons(selectedCohort)
    }
  }, [selectedCohort])

  const fetchCohorts = async () => {
    try {
      const response = await fetch('/api/admin/cohorts')
      const data = await response.json()
      if (data.success) {
        setCohorts(data.cohorts)
        // Auto-select current cohort
        const currentCohort = data.cohorts.find((c: Cohort) => c.is_current)
        if (currentCohort) {
          setSelectedCohort(currentCohort.id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch cohorts:', error)
    }
  }

  const fetchLessons = async (cohortId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/lessons?cohortId=${cohortId}`)
      const data = await response.json()
      if (data.success) {
        setLessons(data.lessons)
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (lesson: Lesson) => {
    setEditingLesson(lesson.id)
    setEditData({
      lessonId: lesson.id,
      available_at: lesson.available_at,
      release_day: lesson.release_day
    })
  }

  const cancelEditing = () => {
    setEditingLesson(null)
    setEditData(null)
    setSaveStatus(null)
  }

  const saveEdit = async () => {
    if (!editData || !selectedCohort) return

    setSaving(true)
    setSaveStatus(null)

    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: editData.lessonId,
          cohortId: selectedCohort,
          available_at: editData.available_at,
          release_day: editData.release_day
        })
      })

      const data = await response.json()

      if (data.success) {
        setSaveStatus({ type: 'success', message: 'Schedule updated successfully' })
        // Refresh lessons
        await fetchLessons(selectedCohort)
        setTimeout(() => {
          cancelEditing()
        }, 1500)
      } else {
        setSaveStatus({ type: 'error', message: data.error || 'Failed to update schedule' })
      }
    } catch (error) {
      console.error('Failed to save schedule:', error)
      setSaveStatus({ type: 'error', message: 'Failed to update schedule' })
    } finally {
      setSaving(false)
    }
  }

  const isLessonAvailable = (availableAt: string) => {
    return new Date() >= new Date(availableAt)
  }

  const formatDate = (dateString: string, timezone: string = 'Africa/Lagos') => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      })
    } catch {
      return dateString
    }
  }

  const getCohortTimezone = () => {
    const cohort = cohorts.find(c => c.id === selectedCohort)
    return cohort?.timezone || 'Africa/Lagos'
  }

  const getSelectedCohort = () => {
    return cohorts.find(c => c.id === selectedCohort)
  }

  const groupLessonsByWeek = () => {
    const grouped: Record<number, Lesson[]> = {}
    lessons.forEach(lesson => {
      if (!grouped[lesson.week_number]) {
        grouped[lesson.week_number] = []
      }
      grouped[lesson.week_number].push(lesson)
    })
    return grouped
  }

  const renderWeekSection = (weekNumber: number, weekLessons: Lesson[]) => {
    const cohort = getSelectedCohort()
    const timezone = cohort?.timezone || 'Africa/Lagos'

    return (
      <div key={weekNumber} className="mb-8">
        <h3 className="mb-4 font-mono text-lg font-semibold text-[#00f0ff] uppercase tracking-wider">
          Week {weekNumber}
        </h3>
        <div className="space-y-3">
          {weekLessons.map((lesson) => {
            const isAvailable = isLessonAvailable(lesson.available_at)
            const isEditing = editingLesson === lesson.id

            return (
              <div
                key={lesson.id}
                className={`border ${
                  isEditing
                    ? 'border-[#00f0ff] bg-[#00f0ff]/5'
                    : isAvailable
                      ? 'border-[#3b494b] bg-[#1a1d24]'
                      : 'border-[#1f2229] bg-[#111317] opacity-60'
                } rounded-lg p-4 transition-colors`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-[#b9cacb]">
                        Session {lesson.session_number}
                      </span>
                      {isAvailable ? (
                        <div className="flex items-center gap-1 text-green-400">
                          <Unlock className="h-4 w-4" />
                          <span className="text-xs font-semibold">Available</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Lock className="h-4 w-4" />
                          <span className="text-xs font-semibold">Locked</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-white mb-1">{lesson.title}</h4>
                    <p className="text-sm text-[#b9cacb] line-clamp-2 mb-2">
                      {lesson.description}
                    </p>
                    {isEditing ? (
                      <div className="space-y-3 mt-4 border-t border-[#1f2229] pt-4">
                        <div>
                          <label className="block text-xs font-mono text-[#b9cacb] mb-2">
                            Release Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={editData?.available_at?.slice(0, 16) || ''}
                            onChange={(e) => setEditData({ ...editData!, available_at: e.target.value + ':00Z' })}
                            className="w-full bg-[#111317] border border-[#3b494b] rounded px-3 py-2 text-white text-sm focus:border-[#00f0ff] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-[#b9cacb] mb-2">
                            Release Day
                          </label>
                          <select
                            value={editData?.release_day || 'monday'}
                            onChange={(e) => setEditData({ ...editData!, release_day: e.target.value })}
                            className="w-full bg-[#111317] border border-[#3b494b] rounded px-3 py-2 text-white text-sm focus:border-[#00f0ff] focus:outline-none"
                          >
                            <option value="monday">Monday</option>
                            <option value="wednesday">Wednesday</option>
                            <option value="friday">Friday</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold px-4 py-2 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Saving...' : <><Save className="h-4 w-4" /> <span>Save</span></>}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-2 border border-[#1f2229] text-[#b9cacb] px-4 py-2 rounded hover:bg-[#1a1d24] transition-colors"
                          >
                            <X className="h-4 w-4" /> Cancel
                          </button>
                        </div>
                        {saveStatus && (
                          <div className={`mt-3 flex items-center gap-2 text-sm ${
                            saveStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {saveStatus.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {saveStatus.message}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 text-xs text-[#b9cacb]">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(lesson.available_at, timezone)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#b9cacb]">
                          <Clock className="h-4 w-4" />
                          <span className="capitalize">{lesson.release_day}</span>
                        </div>
                        <button
                          onClick={() => startEditing(lesson)}
                          className="ml-auto text-xs font-mono text-[#00f0ff] hover:underline"
                        >
                          Edit Schedule
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Cohort Selector */}
      <div className="mb-8 border border-[#1f2229] bg-[#0c0e12] rounded-lg p-6">
        <label className="block text-sm font-mono text-[#b9cacb] mb-3">
          Select Cohort
        </label>
        <select
          value={selectedCohort || ''}
          onChange={(e) => setSelectedCohort(e.target.value)}
          className="w-full bg-[#111317] border border-[#3b494b] rounded px-4 py-3 text-white focus:border-[#00f0ff] focus:outline-none"
        >
          <option value="">-- Select a cohort --</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name} {cohort.is_current && '(Current)'}
            </option>
          ))}
        </select>
      </div>

      {/* Lessons Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-[#b9cacb]">Loading lessons...</div>
        </div>
      ) : selectedCohort && lessons.length > 0 ? (
        <div className="border border-[#1f2229] bg-[#0c0e12] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-bold text-white">
              {getSelectedCohort()?.name} - Schedule
            </h2>
            <div className="text-xs text-[#b9cacb]">
              Timezone: {getCohortTimezone()}
            </div>
          </div>

          {Object.entries(groupLessonsByWeek()).map(([week, weekLessons]) => (
            renderWeekSection(parseInt(week), weekLessons)
          ))}
        </div>
      ) : selectedCohort && lessons.length === 0 ? (
        <div className="border border-[#1f2229] bg-[#0c0e12] rounded-lg p-12 text-center">
          <AlertCircle className="h-12 w-12 text-[#b9cacb] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Lessons Found</h3>
          <p className="text-sm text-[#b9cacb]">
            This cohort has no lessons configured. Add lessons to manage their release schedule.
          </p>
        </div>
      ) : (
        <div className="border border-[#1f2229] bg-[#0c0e12] rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Select a Cohort</h3>
          <p className="text-sm text-[#b9cacb]">
            Choose a cohort above to view and manage its lesson schedule.
          </p>
        </div>
      )}
    </div>
  )
}
