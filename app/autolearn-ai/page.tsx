'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { AlexChat } from '@/components/alex/AlexChat'
import { Loader2 } from 'lucide-react'

export default function AutolearnAIPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
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
    return null
  }

  return (
    <div className="h-screen bg-[#1a1a1a] flex overflow-hidden">
      <AlexChat userId={user?.id || ''} />
    </div>
  )
}
