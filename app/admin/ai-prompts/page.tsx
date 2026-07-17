'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageSquare, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Trash2,
  ArrowLeft,
  Edit,
  Star,
  Copy,
  Check
} from 'lucide-react'

interface AIPrompt {
  id: string
  name: string
  prompt_type: string
  content: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AIPromptsPage() {
  const router = useRouter()
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    prompt_type: 'quiz_generation',
    content: '',
  })

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/admin/ai-prompts')
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to fetch prompts')
      }
      const data = await res.json()
      setPrompts(data.prompts || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [router])

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPrompt.name || !newPrompt.content) return

    try {
      const res = await fetch('/api/admin/ai-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add prompt')
      }

      setShowAddModal(false)
      setNewPrompt({
        name: '',
        prompt_type: 'quiz_generation',
        content: '',
      })
      fetchPrompts()
    } catch (err: any) {
      setError(err.message || 'Failed to add prompt')
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ai-prompts/${id}/activate`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to set active prompt')
      }

      fetchPrompts()
    } catch (err: any) {
      setError(err.message || 'Failed to set active prompt')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const res = await fetch(`/api/admin/ai-prompts/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete prompt')
      }

      fetchPrompts()
    } catch (err: any) {
      setError(err.message || 'Failed to delete prompt')
    }
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-[#b9cacb] font-mono">Loading...</div>
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#b9cacb] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-4xl font-bold text-white">AI Prompts</h1>
              <p className="font-mono text-sm text-[#b9cacb]">Manage AI prompts for quiz generation</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Prompt
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-xl flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    prompt.is_active 
                      ? 'bg-emerald-400/10 border border-emerald-400/50' 
                      : 'bg-[#1f2229] border border-[#2a2d36]'
                  }`}>
                    <MessageSquare className="h-5 w-5 text-[#b9cacb]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-lg font-bold text-white">{prompt.name}</h3>
                      {prompt.is_active && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/50 text-xs font-mono text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#1f2229] border border-[#2a2d36] text-xs font-mono text-[#b9cacb]">
                        v{prompt.version}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-[#5d5f63] mb-2">
                      Type: {prompt.prompt_type}
                    </p>
                    <p className="font-mono text-sm text-[#b9cacb] line-clamp-3">
                      {prompt.content}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(prompt.content, prompt.id)}
                    className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                    title="Copy Content"
                  >
                    {copiedId === prompt.id ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-[#b9cacb]" />
                    )}
                  </button>
                  {!prompt.is_active && (
                    <button
                      onClick={() => handleSetActive(prompt.id)}
                      className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                      title="Set as Active"
                    >
                      <Star className="h-4 w-4 text-yellow-400" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {prompts.length === 0 && (
            <div className="border border-[#1f2229] bg-[#0c0e12] p-12 rounded-xl text-center">
              <MessageSquare className="h-12 w-12 text-[#5d5f63] mx-auto mb-4" />
              <p className="font-mono text-sm text-[#b9cacb]">No AI prompts configured yet</p>
              <p className="font-mono text-xs text-[#5d5f63] mt-2">
                Add your first prompt to start generating quizzes with AI
              </p>
            </div>
          )}
        </div>

        {/* Add Prompt Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-xl p-6 w-full max-w-2xl mx-4">
              <h2 className="font-heading text-2xl font-bold text-white mb-6">Add New Prompt</h2>
              <form onSubmit={handleAddPrompt}>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-sm text-[#b9cacb] mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newPrompt.name}
                      onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                      className="w-full bg-[#0a0c10] border border-[#1f2229] rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                      placeholder="Quiz Generation Prompt"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-sm text-[#b9cacb] mb-2">
                      Prompt Type
                    </label>
                    <select
                      value={newPrompt.prompt_type}
                      onChange={(e) => setNewPrompt({ ...newPrompt, prompt_type: e.target.value })}
                      className="w-full bg-[#0a0c10] border border-[#1f2229] rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                    >
                      <option value="quiz_generation">Quiz Generation</option>
                      <option value="question_generation">Question Generation</option>
                      <option value="answer_validation">Answer Validation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-sm text-[#b9cacb] mb-2">
                      Content
                    </label>
                    <textarea
                      value={newPrompt.content}
                      onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                      className="w-full bg-[#0a0c10] border border-[#1f2229] rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-[#00f0ff] h-48"
                      placeholder="Enter your prompt instructions here..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg font-mono text-sm text-[#b9cacb] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-[#00f0ff] text-black font-bold font-mono text-sm hover:bg-white transition-colors"
                  >
                    Add Prompt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
