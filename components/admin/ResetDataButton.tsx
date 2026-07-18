'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react'

export function ResetDataButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleReset = async (action: 'delete_history' | 'delete_quizzes' | 'delete_all') => {
    setIsDeleting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to perform reset action')
      }

      setSuccess(data.message)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess('')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-red-500/50 bg-red-500/10 text-red-500 font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-red-500 hover:text-white transition-colors text-sm"
      >
        <AlertTriangle className="h-4 w-4" />
        Super Admin Reset
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-red-500/50 bg-[#0c0e12] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-[#5d5f63] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <h3 className="font-heading text-xl font-bold text-white">Danger Zone</h3>
              </div>
              <p className="text-sm text-[#b9cacb] mb-6 font-mono">
                These actions are irreversible. They will permanently delete records from the database.
              </p>

              {error && (
                <div className="mb-4 rounded bg-red-500/20 p-3 text-sm text-red-400 font-mono flex items-start gap-2 border border-red-500/30">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded bg-emerald-500/20 p-3 text-sm text-emerald-400 font-mono flex items-start gap-2 border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {success}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleReset('delete_history')}
                  disabled={isDeleting}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#1f2229] hover:border-orange-500 hover:bg-orange-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="text-left">
                    <div className="font-bold text-white text-sm">Clear Leaderboard & History</div>
                    <div className="text-xs text-[#5d5f63] font-mono mt-1">Deletes all student quiz submissions.</div>
                  </div>
                  <Trash2 className="h-4 w-4 text-orange-500 opacity-50 group-hover:opacity-100" />
                </button>

                <button
                  onClick={() => handleReset('delete_quizzes')}
                  disabled={isDeleting}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#1f2229] hover:border-orange-500 hover:bg-orange-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="text-left">
                    <div className="font-bold text-white text-sm">Delete All Quizzes</div>
                    <div className="text-xs text-[#5d5f63] font-mono mt-1">Deletes all quizzes and their questions.</div>
                  </div>
                  <Trash2 className="h-4 w-4 text-orange-500 opacity-50 group-hover:opacity-100" />
                </button>

                <button
                  onClick={() => handleReset('delete_all')}
                  disabled={isDeleting}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                >
                  <div className="text-left">
                    <div className="font-bold text-red-500 text-sm">Reset Everything</div>
                    <div className="text-xs text-[#5d5f63] font-mono mt-1">Nukes quizzes, questions, and all history.</div>
                  </div>
                  <Trash2 className="h-5 w-5 text-red-500 opacity-50 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
