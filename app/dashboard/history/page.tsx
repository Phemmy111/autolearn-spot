'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HistoryPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard - history feature not yet implemented
    router.replace('/dashboard')
  }, [router])

  return null
}
