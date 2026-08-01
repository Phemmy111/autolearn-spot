import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateCertificateStatus } from '@/lib/analytics/progress-calculator'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/maintenance/certificates
 * 
 * Recalculate certificates for all students in a cohort or all active cohorts
 * Issues certificates to eligible students who don't have one yet
 */
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { cohortId } = body

    let results: any[] = []
    const startTime = Date.now()

    if (!cohortId) {
      return NextResponse.json({ error: 'cohortId parameter required' }, { status: 400 })
    }

    if (cohortId) {
      // Recalculate certificates for specific cohort
      console.log(`[certificate-maintenance] Starting certificate recalculation for cohort ${cohortId}`)
      
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('clerk_user_id')
        .eq('cohort_id', cohortId)
        .eq('status', 'active')

      if (!enrollments || enrollments.length === 0) {
        return NextResponse.json({ error: 'No active students found in cohort' }, { status: 404 })
      }

      let successCount = 0
      let issuedCount = 0

      for (const enrollment of enrollments) {
        try {
          // Check certificate eligibility
          const certificateStatus = await calculateCertificateStatus(enrollment.clerk_user_id, cohortId)
          
          if (certificateStatus.eligible && !certificateStatus.issued) {
            // Issue certificate
            const certificateId = crypto.randomUUID()

            await supabaseAdmin.from('certificates').insert({
              id: certificateId,
              user_id: enrollment.clerk_user_id,
              cohort_id: cohortId,
              student_name: 'Student',
              issued_at: new Date().toISOString(),
            })

            issuedCount++
            results.push({ 
              userId: enrollment.clerk_user_id, 
              status: 'issued',
              action: 'Certificate issued' 
            })
          } else if (certificateStatus.issued) {
            results.push({ 
              userId: enrollment.clerk_user_id, 
              status: 'already_issued',
              action: 'Certificate already exists' 
            })
          } else {
            results.push({ 
              userId: enrollment.clerk_user_id, 
              status: 'not_eligible',
              action: 'Not eligible for certificate' 
            })
          }
          
          successCount++
        } catch (error) {
          console.error(`[certificate-maintenance] Error for user ${enrollment.clerk_user_id}:`, error)
          results.push({ 
            userId: enrollment.clerk_user_id, 
            status: 'error', 
            error: 'Failed to process certificate' 
          })
        }
      }

      const executionTime = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        message: `Certificate recalculation completed for cohort ${cohortId}`,
        cohortId,
        totalStudents: enrollments.length,
        studentsProcessed: successCount,
        certificatesIssued: issuedCount,
        executionTimeMs: executionTime,
        results 
      })
    } else {
      // Recalculate certificates for all active cohorts
      const { data: cohorts } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')

      if (!cohorts || cohorts.length === 0) {
        return NextResponse.json({ error: 'No active cohorts found' }, { status: 404 })
      }

      let totalStudents = 0
      let totalProcessed = 0
      let totalIssued = 0

      for (const cohort of cohorts) {
        try {
          const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select('clerk_user_id')
            .eq('cohort_id', cohort.id)
            .eq('status', 'active')

          if (enrollments) {
            totalStudents += enrollments.length
            
            for (const enrollment of enrollments) {
              try {
                const certificateStatus = await calculateCertificateStatus(enrollment.clerk_user_id, cohort.id)
                
                if (certificateStatus.eligible && !certificateStatus.issued) {
                  const certificateId = crypto.randomUUID()

                  await supabaseAdmin.from('certificates').insert({
                    id: certificateId,
                    user_id: enrollment.clerk_user_id,
                    cohort_id: cohort.id,
                    student_name: 'Student',
                    issued_at: new Date().toISOString(),
                  })

                  totalIssued++
                }
                
                totalProcessed++
              } catch (error) {
                console.error(`[certificate-maintenance] Error for user ${enrollment.clerk_user_id}:`, error)
              }
            }
          }

          results.push({ 
            cohortId: cohort.id, 
            status: 'success', 
            students: enrollments?.length || 0 
          })
        } catch (error) {
          console.error(`[certificate-maintenance] Error for cohort ${cohort.id}:`, error)
          results.push({ 
            cohortId: cohort.id, 
            status: 'error', 
            error: 'Failed to process cohort' 
          })
        }
      }

      const executionTime = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        message: 'Certificate recalculation completed for all cohorts',
        totalCohorts: cohorts.length,
        totalStudents,
        studentsProcessed: totalProcessed,
        certificatesIssued: totalIssued,
        executionTimeMs: executionTime,
        results 
      })
    }
  } catch (error: any) {
    console.error('[POST /api/admin/maintenance/certificates] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
