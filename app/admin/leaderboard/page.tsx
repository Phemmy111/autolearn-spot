import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { Leaderboard } from '@/components/leaderboard'

export default async function AdminLeaderboardPage() {
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Leaderboard</h1>
          <p className="font-mono text-sm text-[#b9cacb]">View student rankings and performance</p>
        </div>

        <Leaderboard />
      </div>
    </div>
  )
}
