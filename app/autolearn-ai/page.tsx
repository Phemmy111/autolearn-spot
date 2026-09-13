'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { AlexChat } from '@/components/alex/AlexChat'
import { Bot, Loader2 } from 'lucide-react'

export default function AutolearnAIPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        // Redirect to sign-in if not authenticated
        router.push('/sign-in')
      } else {
        setIsLoading(false)
      }
    }
  }, [isLoaded, isSignedIn, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#10b981] animate-spin mx-auto mb-4" />
          <p className="text-brand-text/60">Loading ALEX...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null // Will redirect
  }

  return (
    <div className="h-screen bg-brand-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-bg/95 backdrop-blur-xl px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-bg/10 rounded-lg">
              <Bot className="h-5 w-5 text-[#10b981]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-brand-text">ALEX</h1>
              <p className="text-xs text-brand-text/60">AutoLearn Intelligence & Execution Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-text/60">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <div className="flex-1 min-h-0">
        <AlexChat userId={user?.id || ''} />
      </div>
    </div>
  )
}
