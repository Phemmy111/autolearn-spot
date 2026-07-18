'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Upload, FileText, Loader2, Bot } from 'lucide-react'
import Link from 'next/link'

interface GeneratedQuestion {
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation: string
  points: number
}

interface GeneratedQuiz {
  title: string
  description: string
  week_number: number
  phase: string
  questions: GeneratedQuestion[]
}

interface AIProvider {
  id: string
  name: string
  provider_type: string
  default_model: string | null
  models: string[]
  is_active: boolean
  is_default: boolean
}

interface AIPrompt {
  id: string
  name: string
  prompt_type: string
  content: string
  version: number
  is_active: boolean
}

export default function GenerateQuizPage() {
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'generating' | 'review'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [script, setScript] = useState('')
  const [weekNumber, setWeekNumber] = useState(1)
  const [phase, setPhase] = useState('WEEK_1')
  const [questionCount, setQuestionCount] = useState(10)
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null)
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string>('')

  useEffect(() => {
    fetchProviders()
    fetchPrompts()
  }, [])

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/ai-providers')
      if (res.ok) {
        const data = await res.json()
        const activeProviders = (data.providers || []).filter((p: AIProvider) => p.is_active)
        setProviders(activeProviders)
        
        // Auto-select the default provider
        const defaultProvider = activeProviders.find((p: AIProvider) => p.is_default)
        if (defaultProvider) {
          setSelectedProviderId(defaultProvider.id)
          setSelectedModel(defaultProvider.default_model || '')
        } else if (activeProviders.length > 0) {
          setSelectedProviderId(activeProviders[0].id)
          setSelectedModel(activeProviders[0].default_model || '')
        }
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err)
    }
  }

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/admin/ai-prompts')
      if (res.ok) {
        const data = await res.json()
        const quizPrompts = (data.prompts || []).filter((p: AIPrompt) => p.prompt_type === 'quiz_generation')
        setPrompts(quizPrompts)
        
        // Auto-select the active prompt
        const activePrompt = quizPrompts.find((p: AIPrompt) => p.is_active)
        if (activePrompt) {
          setSelectedPromptId(activePrompt.id)
        } else if (quizPrompts.length > 0) {
          setSelectedPromptId(quizPrompts[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch prompts:', err)
    }
  }

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError('Please provide a lesson script')
      return
    }

    if (!selectedProviderId) {
      setError('Please select an AI provider')
      return
    }

    if (!selectedModel) {
      setError('Please select a model')
      return
    }

    if (!selectedPromptId) {
      setError('Please select an AI prompt')
      return
    }

    setLoading(true)
    setStep('generating')
    setError(null)

    try {
      const res = await fetch('/api/admin/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          weekNumber,
          phase,
          questionCount,
          providerId: selectedProviderId,
          model: selectedModel,
          promptId: selectedPromptId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to generate quiz')
      }

      const data = await res.json()
      setGeneratedQuiz(data.quiz)
      setStep('review')
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz')
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuiz = async () => {
    if (!generatedQuiz) return

    setLoading(true)
    setError(null)

    try {
      // First create the quiz
      const quizRes = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedQuiz.title,
          description: generatedQuiz.description,
          week_number: generatedQuiz.week_number,
          phase: generatedQuiz.phase,
          time_limit: 30,
          passing_score: 70,
          is_active: false, // Don't auto-publish
        }),
      })

      if (!quizRes.ok) {
        throw new Error('Failed to create quiz')
      }

      const quizData = await quizRes.json()
      const quizId = quizData.quiz.id

      // Then create all questions
      for (const question of generatedQuiz.questions) {
        await fetch(`/api/admin/quizzes/${quizId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question),
        })
      }

      router.push(`/admin/quizzes/${quizId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz')
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setScript(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#00f0ff] animate-spin mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-white mb-2">Generating Quiz...</h2>
          <p className="font-mono text-sm text-[#b9cacb]">AI is analyzing your lesson script</p>
        </div>
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
          <h1 className="font-heading text-4xl font-bold text-white mb-2">AI Quiz Generator</h1>
          <p className="font-mono text-sm text-[#b9cacb]">
            Generate quizzes automatically from your lesson scripts
          </p>
        </div>

        {step === 'input' && (
          <div className="max-w-3xl">
            {error && (
              <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-lg">
                <p className="font-mono text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                    Week Number
                  </label>
                  <input
                    type="number"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                    min="1"
                    max="12"
                    className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                    Phase
                  </label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                  >
                    <option value="WEEK_1">WEEK_1</option>
                    <option value="WEEK_2">WEEK_2</option>
                    <option value="WEEK_3">WEEK_3</option>
                    <option value="WEEK_4">WEEK_4</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                    Questions Count
                  </label>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                    AI Provider
                  </label>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => {
                      setSelectedProviderId(e.target.value)
                      const provider = providers.find(p => p.id === e.target.value)
                      setSelectedModel(provider?.default_model || '')
                    }}
                    className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                  >
                    {providers.length === 0 ? (
                      <option value="">No active providers</option>
                    ) : (
                      providers.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name} {provider.is_default && '(Default)'}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                  >
                    {selectedProviderId ? (
                      (() => {
                        const provider = providers.find(p => p.id === selectedProviderId)
                        const models = provider?.models || []
                        if (models.length === 0) {
                          return <option value="">No models available</option>
                        }
                        return models.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))
                      })()
                    ) : (
                      <option value="">Select a provider first</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  AI Prompt
                </label>
                <select
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-white font-mono text-sm focus:border-[#00f0ff] outline-none transition-colors"
                >
                  {prompts.length === 0 ? (
                    <option value="">No quiz prompts configured</option>
                  ) : (
                    prompts.map(prompt => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.name} (v{prompt.version}) {prompt.is_active && '(Active)'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {providers.length === 0 && (
                <div className="border border-yellow-500/50 bg-yellow-500/10 p-4 rounded-lg flex items-center gap-3">
                  <Bot className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="font-mono text-sm text-yellow-400">No AI providers configured</p>
                    <Link href="/admin/ai-providers" className="font-mono text-xs text-[#b9cacb] hover:text-white">
                      Configure AI providers →
                    </Link>
                  </div>
                </div>
              )}

              {prompts.length === 0 && (
                <div className="border border-yellow-500/50 bg-yellow-500/10 p-4 rounded-lg flex items-center gap-3">
                  <Bot className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="font-mono text-sm text-yellow-400">No quiz generation prompts configured</p>
                    <Link href="/admin/ai-prompts" className="font-mono text-xs text-[#b9cacb] hover:text-white">
                      Configure AI prompts →
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2 uppercase tracking-wider">
                  Lesson Script
                </label>
                <div className="border border-[#1f2229] bg-[#0c0e12] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-[#1f2229] bg-[#111317]">
                    <span className="font-mono text-xs text-[#b9cacb]">Paste your script or upload a file</span>
                    <label className="flex items-center gap-2 text-[#00f0ff] hover:text-white font-mono text-xs cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Upload File
                      <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 bg-[#0c0e12] text-white font-mono text-sm focus:outline-none resize-y"
                    placeholder="Paste your weekly lesson script here. The AI will analyze it and generate relevant quiz questions..."
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !script.trim()}
                className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? 'Generating...' : 'Generate Quiz'}
              </button>
            </div>
          </div>
        )}

        {step === 'review' && generatedQuiz && (
          <div className="max-w-4xl">
            <div className="mb-6 border border-[#00f0ff]/50 bg-[#00f0ff]/10 p-4 rounded-lg">
              <p className="font-mono text-sm text-[#00f0ff]">
                Quiz generated successfully! Review the questions below before creating.
              </p>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl mb-6">
              <h2 className="font-heading text-2xl font-bold text-white mb-2">{generatedQuiz.title}</h2>
              <p className="font-mono text-sm text-[#b9cacb] mb-4">{generatedQuiz.description}</p>
              <div className="flex gap-4 font-mono text-xs text-[#5d5f63]">
                <span>Week {generatedQuiz.week_number}</span>
                <span>{generatedQuiz.phase}</span>
                <span>{generatedQuiz.questions.length} questions</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {generatedQuiz.questions.map((question, index) => (
                <div
                  key={index}
                  className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <span className="px-2 py-1 bg-[#00f0ff]/10 text-[#00f0ff] font-mono text-xs rounded">
                      Q{index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-mono text-sm text-white mb-2">{question.question_text}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-[#1f2229] text-[#b9cacb] font-mono text-xs rounded">
                          {question.question_type}
                        </span>
                        <span className="px-2 py-1 bg-[#1f2229] text-[#b9cacb] font-mono text-xs rounded">
                          {question.points} pts
                        </span>
                      </div>
                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-1 mb-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`font-mono text-xs ${
                                option === question.correct_answer
                                  ? 'text-emerald-400'
                                  : 'text-[#b9cacb]'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {option === question.correct_answer && ' ✓'}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.question_type === 'true_false' && (
                        <p className="font-mono text-xs text-emerald-400 mb-2">
                          Correct: {question.correct_answer}
                        </p>
                      )}
                      {question.explanation && (
                        <p className="font-mono text-xs text-[#5d5f63]">
                          Explanation: {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-lg">
                <p className="font-mono text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleCreateQuiz}
                disabled={loading}
                className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                {loading ? 'Creating...' : 'Create Quiz'}
              </button>
              <button
                onClick={() => setStep('input')}
                className="font-mono text-sm text-[#b9cacb] hover:text-white px-6 py-3"
              >
                Regenerate
              </button>
              <Link
                href="/admin/quizzes"
                className="font-mono text-sm text-[#b9cacb] hover:text-white px-6 py-3"
              >
                Cancel
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
