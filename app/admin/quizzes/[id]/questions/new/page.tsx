'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function NewQuestionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<any>(null)
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['A', 'B', 'C', 'D'],
    correct_answer: '',
    explanation: '',
    points: 1,
  })

  useEffect(() => {
    async function loadQuiz() {
      const res = await fetch(`/api/admin/quizzes/${params.id}`)
      if (res.ok) {
        const { quiz } = await res.json()
        if (quiz) setQuiz(quiz)
      }
    }
    loadQuiz()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/quizzes/${params.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create question')
      }

      router.push(`/admin/quizzes/${params.id}/questions`)
    } catch (err: any) {
      setError(err.message || 'Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const addOption = () => {
    setFormData(prev => ({ ...prev, options: [...prev.options, ''] }))
  }

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return
    const newOptions = formData.options.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href={`/admin/quizzes/${params.id}/questions`}
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Add Question</h1>
          <p className="font-mono text-sm text-[#b9cacb]">{quiz?.title || 'Quiz'}</p>
        </div>

        <div className="max-w-3xl">
          {error && (
            <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-lg">
              <p className="font-mono text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                Question Text
              </label>
              <textarea
                name="question_text"
                value={formData.question_text}
                onChange={handleChange}
                rows={3}
                required
                className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors resize-y"
                placeholder="Enter your question here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Question Type
                </label>
                <select
                  name="question_type"
                  value={formData.question_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Points
                </label>
                <input
                  type="number"
                  name="points"
                  value={formData.points}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                />
              </div>
            </div>

            {formData.question_type === 'multiple_choice' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-mono text-xs text-[#b9cacb] uppercase tracking-wider">
                    Answer Options
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1 text-[#00f0ff] hover:text-white font-mono text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add Option
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        required
                        className="flex-1 px-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.question_type === 'true_false' && (
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Correct Answer
                </label>
                <select
                  name="correct_answer"
                  value={formData.correct_answer}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                >
                  <option value="">Select correct answer</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            )}

            {formData.question_type === 'short_answer' && (
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Correct Answer
                </label>
                <input
                  type="text"
                  name="correct_answer"
                  value={formData.correct_answer}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                  placeholder="Enter the correct answer"
                />
              </div>
            )}

            {formData.question_type === 'multiple_choice' && (
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Correct Answer
                </label>
                <select
                  name="correct_answer"
                  value={formData.correct_answer}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                >
                  <option value="">Select correct answer</option>
                  {formData.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option || `Option ${String.fromCharCode(65 + index)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                Explanation (optional)
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors resize-y"
                placeholder="Explain why this is the correct answer..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Creating...' : 'Add Question'}
              </button>
              <Link
                href={`/admin/quizzes/${params.id}/questions`}
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
