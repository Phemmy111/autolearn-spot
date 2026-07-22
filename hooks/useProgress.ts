import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { LessonProgress } from '@/lib/progress-service'

const getStorageKey = (userId: string) => `autolearn-progress-${userId}`

export function useProgress() {
  const { userId } = useAuth()
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [progressData, setProgressData] = useState<LessonProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    if (!userId) return

    try {
      const res = await fetch('/api/progress')
      const data = await res.json()

      if (data.progress) {
        setProgressData(data.progress)
        const completed = data.progress
          .filter((p: LessonProgress) => p.completed)
          .map((p: LessonProgress) => p.lesson_id)
        setCompletedIds(completed)
      }
    } catch (err) {
      console.error('[useProgress] Error fetching progress:', err)
      // Fallback to local storage if API fails
      try {
        const raw = localStorage.getItem(getStorageKey(userId))
        if (raw) setCompletedIds(JSON.parse(raw))
      } catch (e) {
        // ignore
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Initial load and migration
  useEffect(() => {
    if (!userId) return

    const init = async () => {
      // 1. Check if we need to migrate old local storage progress
      try {
        const storageKey = getStorageKey(userId)
        const raw = localStorage.getItem(storageKey)
        
        if (raw) {
          const localCompletedIds = JSON.parse(raw)
          
          if (Array.isArray(localCompletedIds) && localCompletedIds.length > 0) {
            console.log('[useProgress] Found local progress, initiating migration...')
            
            const migrateRes = await fetch('/api/progress/migrate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completedLessonIds: localCompletedIds }),
            })
            
            const migrateData = await migrateRes.json()
            
            // If successfully migrated OR already exists on server, clear local storage
            if (migrateData.migrated || migrateData.reason === 'already_exists') {
              console.log('[useProgress] Migration complete or data exists. Clearing local storage.')
              localStorage.removeItem(storageKey)
            }
          } else {
             // Clean up empty arrays just in case
             localStorage.removeItem(storageKey)
          }
        }
      } catch (e) {
        console.error('[useProgress] Migration error:', e)
      }

      // 2. Fetch server progress
      await fetchProgress()
    }

    init()
  }, [userId, fetchProgress])

  // Listen for cross-component sync events
  useEffect(() => {
    const handleUpdate = () => {
      fetchProgress()
    }

    window.addEventListener('autolearn-progress-updated', handleUpdate)
    window.addEventListener('progress-updated', handleUpdate)

    return () => {
      window.removeEventListener('autolearn-progress-updated', handleUpdate)
      window.removeEventListener('progress-updated', handleUpdate)
    }
  }, [fetchProgress])

  const markComplete = async (lessonId: string, courseSlug: string = 'ai-automation-bootcamp') => {
    if (!userId) return

    // Optimistic update
    if (!completedIds.includes(lessonId)) {
      setCompletedIds((prev) => [...prev, lessonId])
    }

    try {
      // 1. Call standard certificate complete API to handle certificate issuance
      // We do this concurrently with the progress save
      fetch('/api/certificate/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, lessonId }),
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.dispatchEvent(new Event('certificate-unlocked'))
        }
      })
      .catch((err) => console.error('[useProgress] cert complete error:', err))

      // 2. Persist progress to server
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, watchPct: 100, completed: true }),
      })

      if (res.ok) {
        window.dispatchEvent(new Event('autolearn-progress-updated'))
        window.dispatchEvent(new Event('progress-updated'))
      } else {
         // Fallback to local storage if API fails completely
         console.warn('[useProgress] Server save failed, falling back to local storage temporarily')
         const storageKey = getStorageKey(userId)
         const current = localStorage.getItem(storageKey)
         const currentArr = current ? JSON.parse(current) : []
         if (!currentArr.includes(lessonId)) {
             localStorage.setItem(storageKey, JSON.stringify([...currentArr, lessonId]))
         }
      }
    } catch (err) {
      console.error('[useProgress] markComplete error:', err)
       // Fallback to local storage if network fails
       const storageKey = getStorageKey(userId)
       const current = localStorage.getItem(storageKey)
       const currentArr = current ? JSON.parse(current) : []
       if (!currentArr.includes(lessonId)) {
           localStorage.setItem(storageKey, JSON.stringify([...currentArr, lessonId]))
       }
    }
  }

  return {
    completedIds,
    progressData,
    isLoading,
    fetchProgress,
    markComplete
  }
}
