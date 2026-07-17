'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function EditQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    week_number: 1,
    phase: 'WEEK_1',
    time_limit: 30,
    passing_score: 70,
    is_active: true,
  })

  useEffect(() => {
    async function loadQuiz() {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        setError(error.message)
      } else if (data) {
        setFormData({
          title: data.title,
          description: data.description || '',
          week_number: data.week_number,
          phase: data.phase,
          time_limit: data.time_limit || 30,
          passing_score: data.passing_score,
          is_active: data.is_active,
        })
      }
      setLoading(false)
    }
    loadQuiz()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/quizzes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update quiz')
      }

      router.push('/admin/quizzes')
    } catch (err: any) {
      setError(err.message || 'Failed to update quiz')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete all questions and responses.')) {
      return
    }

    try {
      const res = await fetch(`/api/quizzes/${params.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete quiz')
      }

      router.push('/admin/quizzes')
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f0ff]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/admin/quizzes"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quizzes
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Edit Quiz</h1>
          <p className="font-mono text-sm text-[#b9cacb]">Update quiz information</p>
        </div>

        <div className="max-w-2xl">
          {error && (
            <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-lg">
              <p className="font-mono text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                Quiz Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Week Number
                </label>
                <input
                  type="number"
                  name="week_number"
                  value={formData.week_number}
                  onChange={handleChange}
                  min="1"
                  max="12"
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Phase
                </label>
                <select
                  name="phase"
                  value={formData.phase}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                >
                  <option value="WEEK_1">WEEK_1</option>
                  <option value="WEEK_2">WEEK_2</option>
                  <option value="WEEK_3">WEEK_3</option>
                  <option value="WEEK_4">WEEK_4</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  name="time_limit"
                  value={formData.time_limit}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  name="passing_score"
                  value={formData.passing_score}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 accent-[#00f0ff]"
              />
              <label htmlFor="is_active" className="font-mono text-sm text-[#b9cacb]">
                Quiz is active and available to students
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-500/10 text-red-400 font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Quiz
              </button>
              <Link
                href="/admin/quizzes"
                className="font-mono text-sm text-[#b9cacb] hover:text-white px-6 py-3"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
