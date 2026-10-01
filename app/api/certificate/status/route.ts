import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserEnrollments, resolveLearningProduct } from '@/lib/enrollment-service'
import { 
  calculateVideoProgress, 
  calculateAssignmentProgress, 
  calculateQuizProgress,
  calculateOverallProgress,
  calculateCertificateStatus
} from '@/lib/analytics/progress-calculator'

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
        
        // Calculate progress for this cohort
        const [videoProgress, assignmentProgress, quizProgress] = await Promise.all([
          calculateVideoProgress(userId, cohortId),
          calculateAssignmentProgress(userId, cohortId),
          calculateQuizProgress(userId, cohortId),
        ])
        
        const overallProgress = calculateOverallProgress(
          videoProgress,
          assignmentProgress,
          quizProgress
        )
        
        const certStatus = await calculateCertificateStatus(userId, cohortId)
        
        let certRecord = null
        const { data: existingCert } = await supabaseAdmin
          .from('certificates')
          .select('id, issued_at')
          .eq('user_id', userId)
          .eq('cohort_id', cohortId)
          .maybeSingle()
          
        certRecord = existingCert

        const cohortObj = Array.isArray(enrollment.cohort) ? enrollment.cohort[0] : enrollment.cohort
        const fallbackTitle = cohortObj?.name || 'Unknown Course'

        // Auto-generate certificate record if 100% and no record
        const isEligible = certStatus.eligible || overallProgress.percentage >= 100
        if (isEligible && !certRecord) {
          const newCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
          const { data: newCert } = await supabaseAdmin
            .from('certificates')
            .insert({
              user_id: userId,
              cohort_id: cohortId,
              learning_product_id: learningProduct?.id,
              course_title: learningProduct?.title || fallbackTitle,
              user_name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Student',
              certificate_code: newCode,
              issued_at: new Date().toISOString()
            })
            .select('id, issued_at')
            .single()
            
          if (newCert) {
            certRecord = newCert
          }
        }

        return {
          id: certRecord?.id || `pending-${cohortId}`,
          cohort_id: cohortId,
          course_title: learningProduct?.title || fallbackTitle,
          course_slug: learningProduct?.slug || 'unknown-course',
          progress: overallProgress.percentage,
          is_unlocked: certStatus.eligible || overallProgress.percentage >= 100,
          issued_at: certRecord?.issued_at || null,
          has_certificate_record: !!certRecord
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
