import { QuizList } from '@/components/quiz-list'
import { Leaderboard } from '@/components/leaderboard'

export default function QuizzesPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Weekly Quizzes</h1>
          <p className="font-mono text-sm text-[#b9cacb] max-w-2xl">
            Test your knowledge with our weekly quizzes. Each quiz covers the material from that week's sessions.
            Complete quizzes to track your progress and climb the leaderboard!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <QuizList />
          </div>
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  )
}
