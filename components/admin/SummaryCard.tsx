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
      <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all duration-300 group">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#00f0ff]/10 rounded-lg group-hover:scale-110 transition-transform">
            <BookOpen className="h-6 w-6 text-[#00f0ff]" />
          </div>
          <div>
            <p className="font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-1">Total Quizzes</p>
            <p className="font-heading text-3xl font-bold text-white">{quizzesCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all duration-300 group">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-400/10 rounded-lg group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-1">Total Students</p>
            <p className="font-heading text-3xl font-bold text-white">{totalStudents}</p>
          </div>
        </div>
      </div>

      <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all duration-300 group">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-400/10 rounded-lg group-hover:scale-110 transition-transform">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-1">Pass Rate</p>
            <p className="font-heading text-3xl font-bold text-white">{Math.round(passRate)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
