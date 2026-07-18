'use client'

import { Trash2 } from 'lucide-react'

export function DeleteQuizButton({ quizId }: { quizId: string }) {
  return (
    <form
      action={`/api/admin/quizzes/${quizId}`}
      method="DELETE"
      onSubmit={(e) => {
        if (!confirm('Are you sure you want to delete this quiz? This will also delete all questions and responses.')) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-2 text-red-400 hover:text-red-300 font-mono text-xs uppercase tracking-wider transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </form>
  )
}
