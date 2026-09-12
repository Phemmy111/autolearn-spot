import { supabaseAdmin } from '@/lib/supabase'
import { BookOpen, Users, Trophy } from 'lucide-react'

export async function SummaryCard() {
  // Fetch total quizzes
  const { count: quizzesCount } = await supabaseAdmin
    .from('quizzes')
    .select('*', { count: 'exact', head: true })

  // Fetch unique students
  const { data: responses } = await supabaseAdmin
    .from('quiz_responses')
    .select('user_id, passed')

  let totalStudents = 0
  let passRate = 0

  if (responses) {
    const uniqueUsers = new Set(responses.map(r => r.user_id))
    totalStudents = uniqueUsers.size

    const totalPassed = responses.filter(r => r.passed).length
    const totalResponses = responses.length
    passRate = totalResponses > 0 ? (totalPassed / totalResponses) * 100 : 0
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="border border-neutral-200 bg-gray-100 p-6 rounded-xl hover:border-neutral-300 transition-all duration-300 group shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-100]/10 rounded-lg md:group-hover:scale-110 transition-transform">
            <BookOpen className="h-6 w-6 text-[#10b981]" />
          </div>
          <div>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Quizzes</p>
            <p className="font-heading text-3xl font-bold text-neutral-900">{quizzesCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="border border-neutral-200 bg-gray-100 p-6 rounded-xl hover:border-neutral-300 transition-all duration-300 group shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg md:group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Students</p>
            <p className="font-heading text-3xl font-bold text-neutral-900">{totalStudents}</p>
          </div>
        </div>
      </div>

      <div className="border border-neutral-200 bg-gray-100 p-6 rounded-xl hover:border-neutral-300 transition-all duration-300 group shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg md:group-hover:scale-110 transition-transform">
            <Trophy className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider mb-1">Pass Rate</p>
            <p className="font-heading text-3xl font-bold text-neutral-900">{Math.round(passRate)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
