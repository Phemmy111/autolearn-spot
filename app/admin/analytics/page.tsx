import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Target, HelpCircle } from 'lucide-react'

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ quizId?: string }> }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/')
  }

  const { quizId } = await searchParams

  // Fetch all quizzes for the dropdown
  const { data: quizzes, error: quizzesError } = await supabaseAdmin
    .from('quizzes')
    .select('id, title, week_number, is_active')
    .order('week_number', { ascending: true })

  if (quizzesError) {
    return <div className="text-red-400 p-8">Failed to load quizzes</div>
  }

  // If a quiz is selected, calculate analytics
  let analyticsData = null

  if (quizId) {
    // 1. Fetch questions
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true })

    // 2. Fetch responses
    const { data: responses } = await supabaseAdmin
      .from('quiz_responses')
      .select('answers, user_id, percentage, passed')
      .eq('quiz_id', quizId)

    if (questions && responses && responses.length > 0) {
      const totalStudents = responses.length
      
      const questionStats = questions.map((q: any) => {
        let correctCount = 0

        responses.forEach((response: any) => {
          const userAnswer = (response.answers?.[q.id] || '').trim()
          const correctAnswer = (q.correct_answer || '').trim()
          
          let isCorrect = userAnswer === correctAnswer

          if (!isCorrect && q.question_type === 'multiple_choice') {
             const correctLetterMatch = correctAnswer.match(/^[A-D](?:\.|\))?$/i)
             if (correctLetterMatch) {
                const letter = correctAnswer.charAt(0).toUpperCase()
                if (userAnswer.toUpperCase().startsWith(`${letter}.`) || userAnswer.toUpperCase().startsWith(`${letter})`) || userAnswer.toUpperCase().startsWith(`${letter} `)) {
                  isCorrect = true
                }
             }
             if (!isCorrect && userAnswer.length > 2 && correctAnswer.length > 2) {
                const cleanUser = userAnswer.toLowerCase().replace(/^[a-d][.)]\s*/, '').trim()
                const cleanCorrect = correctAnswer.toLowerCase().replace(/^[a-d][.)]\s*/, '').trim()
                if (cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
                  isCorrect = true
                }
             }
          }

          if (isCorrect) correctCount++
        })

        const successRate = (correctCount / totalStudents) * 100
        
        let difficulty = 'Moderate'
        if (successRate >= 80) difficulty = 'Easiest'
        else if (successRate <= 40) difficulty = 'Most Difficult'

        return {
          ...q,
          correctCount,
          successRate,
          difficulty
        }
      })

      // Sort by success rate to get easiest and hardest
      const sortedBySuccess = [...questionStats].sort((a, b) => b.successRate - a.successRate)
      const easiest = sortedBySuccess.filter(q => q.difficulty === 'Easiest')
      const hardest = sortedBySuccess.filter(q => q.difficulty === 'Most Difficult')
      const moderate = sortedBySuccess.filter(q => q.difficulty === 'Moderate')

      const averageScore = responses.reduce((acc: number, r: any) => acc + r.percentage, 0) / totalStudents
      const passRate = (responses.filter((r: any) => r.passed).length / totalStudents) * 100

      analyticsData = {
        totalStudents,
        averageScore,
        passRate,
        questionStats,
        easiest,
        hardest,
        moderate
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Quiz Analytics</h1>
          <p className="font-mono text-sm text-[#b9cacb]">Analyze question difficulty and student performance</p>
        </div>

        {/* Quiz Selector */}
        <div className="border border-[#1f2229] bg-[#0c0e12] rounded-xl p-6 mb-8">
          <form className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <label htmlFor="quizId" className="block font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-2">
                Select Quiz to Analyze
              </label>
              <select
                id="quizId"
                name="quizId"
                defaultValue={quizId || ''}
                className="w-full bg-[#111317] border border-[#1f2229] rounded-lg p-3 text-white font-mono text-sm focus:border-[#00f0ff] outline-none"
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/admin/analytics?quizId=${e.target.value}`
                  }
                }}
              >
                <option value="" disabled>-- Select a Quiz --</option>
                {quizzes?.map(q => (
                  <option key={q.id} value={q.id}>
                    Week {q.week_number}: {q.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[#b9cacb] font-mono text-xs">
              <HelpCircle className="h-4 w-4 text-[#00f0ff]" />
              <span>Select a quiz to view question difficulty metrics.</span>
            </div>
          </form>
        </div>

        {/* Analytics Dashboard */}
        {quizId && !analyticsData && (
          <div className="text-center p-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl">
            <p className="font-mono text-[#b9cacb]">No submissions yet for this quiz.</p>
          </div>
        )}

        {analyticsData && (
          <div className="space-y-8">
            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl text-center">
                <p className="font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-2">Total Submissions</p>
                <p className="font-heading text-4xl font-bold text-white">{analyticsData.totalStudents}</p>
              </div>
              <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl text-center">
                <p className="font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-2">Average Score</p>
                <p className="font-heading text-4xl font-bold text-[#00f0ff]">{Math.round(analyticsData.averageScore)}%</p>
              </div>
              <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl text-center">
                <p className="font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-2">Pass Rate</p>
                <p className="font-heading text-4xl font-bold text-emerald-400">{Math.round(analyticsData.passRate)}%</p>
              </div>
            </div>

            {/* Question breakdown */}
            <div className="border border-[#1f2229] bg-[#0c0e12] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#1f2229] bg-[#111317]">
                <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#00f0ff]" />
                  Question Difficulty Breakdown
                </h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f2229] bg-[#0c0e12]">
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[#5d5f63]">Q#</th>
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[#5d5f63]">Question Preview</th>
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[#5d5f63]">Difficulty</th>
                    <th className="px-6 py-4 text-right font-mono text-xs uppercase tracking-wider text-[#5d5f63]">Correct Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.questionStats.map((q: any, i: number) => {
                    let diffClass = 'text-amber-400 bg-amber-400/10' // Moderate
                    let icon = <Target className="h-4 w-4" />
                    if (q.difficulty === 'Easiest') {
                      diffClass = 'text-emerald-400 bg-emerald-400/10'
                      icon = <TrendingUp className="h-4 w-4" />
                    } else if (q.difficulty === 'Most Difficult') {
                      diffClass = 'text-red-400 bg-red-400/10'
                      icon = <TrendingDown className="h-4 w-4" />
                    }

                    return (
                      <tr key={q.id} className="border-b border-[#1f2229] hover:bg-[#111317] transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-[#b9cacb]">
                          {i + 1}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm text-white line-clamp-1 max-w-md">
                            {q.question_text}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded font-mono text-xs font-bold ${diffClass}`}>
                            {icon}
                            {q.difficulty}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-mono text-sm font-bold text-white">
                            {Math.round(q.successRate)}%
                          </p>
                          <p className="font-mono text-xs text-[#5d5f63]">
                            {q.correctCount} / {analyticsData.totalStudents} students
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
