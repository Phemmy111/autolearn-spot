import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserEnrollments, resolveLearningProduct } from '@/lib/enrollment-service'
import { calculateVideoProgress } from '@/lib/analytics/progress-calculator'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    const email = user?.emailAddresses[0]?.emailAddress || ''
    
    // Get all enrollments for this user
    const enrollments = await getUserEnrollments(userId, email)
    
    const certificates = await Promise.all(
      enrollments.map(async (enrollment) => {
        const cohortId = enrollment.cohort_id
        const learningProduct = resolveLearningProduct(enrollment)
        const productId = learningProduct?.id || enrollment.learning_product_id
        const courseTitle = learningProduct?.title || 'AI Automation with n8n'
        const courseSlug = learningProduct?.slug || 'ai-automation-with-n8n'

        // 1. Calculate lesson progress directly for this product
        let progressPct = 0
        let totalLessonCount = 0
        let completedLessonCount = 0

        if (productId) {
          const { data: productLessons } = await supabaseAdmin
            .from('lessons')
            .select('id, uuid_id')
            .eq('product_id', productId)

          if (productLessons && productLessons.length > 0) {
            totalLessonCount = productLessons.length
            const { data: completedRows } = await supabaseAdmin
              .from('lesson_progress')
              .select('lesson_id, lesson_uuid_id, completed, watch_pct')
              .eq('user_id', userId)
              .or('completed.eq.true,watch_pct.gte.80')

            const completedLessonSet = new Set<string>()
            for (const row of completedRows || []) {
              for (const l of productLessons) {
                if (
                  (row.lesson_uuid_id && row.lesson_uuid_id === l.uuid_id) ||
                  (row.lesson_id && row.lesson_id === l.id) ||
                  (row.lesson_id && row.lesson_id === l.uuid_id) ||
                  (row.lesson_uuid_id && row.lesson_uuid_id === l.id)
                ) {
                  completedLessonSet.add(l.uuid_id || l.id)
                }
              }
            }
            completedLessonCount = completedLessonSet.size
            progressPct = Math.min(100, Math.round((completedLessonCount / totalLessonCount) * 100))
          }
        }

        // Fallback for legacy cohort-only lessons if no product lessons found
        if (totalLessonCount === 0 && cohortId) {
          const videoProgress = await calculateVideoProgress(userId, cohortId)
          totalLessonCount = videoProgress.total
          completedLessonCount = videoProgress.completed
          progressPct = videoProgress.percentage
        }

        // 2. Check for existing certificate record
        let certRecord = null
        if (productId) {
          const { data: certByProd } = await supabaseAdmin
            .from('certificates')
            .select('id, issued_at, certificate_code')
            .eq('user_id', userId)
            .eq('learning_product_id', productId)
            .maybeSingle()
          certRecord = certByProd
        }

        if (!certRecord && cohortId) {
          const { data: certByCohort } = await supabaseAdmin
            .from('certificates')
            .select('id, issued_at, certificate_code')
            .eq('user_id', userId)
            .eq('cohort_id', cohortId)
            .maybeSingle()
          certRecord = certByCohort
        }

        const isUnlocked = progressPct >= 100 || !!certRecord

        // 3. Auto-issue certificate if unlocked and record does not exist
        if (isUnlocked && !certRecord) {
          const newCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
          const studentFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || enrollment.full_name || 'Student'
          
          const { data: newCert } = await supabaseAdmin
            .from('certificates')
            .insert({
              user_id: userId,
              cohort_id: cohortId || '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
              learning_product_id: productId,
              course_title: courseTitle,
              user_name: studentFullName,
              certificate_code: newCode,
              issued_at: new Date().toISOString()
            })
            .select('id, issued_at, certificate_code')
            .single()

          if (newCert) {
            certRecord = newCert
          }
        }

        return {
          id: certRecord?.id || `pending-${productId || cohortId}`,
          cohort_id: cohortId,
          learning_product_id: productId,
          course_title: courseTitle,
          course_slug: courseSlug,
          progress: progressPct,
          is_unlocked: isUnlocked,
          issued_at: certRecord?.issued_at || null,
          has_certificate_record: !!certRecord,
          certificate_code: certRecord?.certificate_code || null,
        }
      })
    )

    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Student'

    return NextResponse.json({
      certificates,
      fullName,
      userId,
    })
  } catch (err) {
    console.error('Certificate status error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
