import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { Leaderboard } from '@/components/leaderboard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Leaderboard</h1>
          <p className="font-mono text-sm text-[#b9cacb]">View student rankings and performance</p>
        </div>

        <Leaderboard />
      </div>
    </div>
  )
}
