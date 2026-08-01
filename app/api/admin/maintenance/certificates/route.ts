import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateCertificateStatus } from '@/lib/analytics/progress-calculator'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json().catch(() => ({}))
    const { cohortId } = body

    let results: any[] = []
    const startTime = Date.now()

    let studentsProcessed = 0
    let studentsSucceeded = 0
    let studentsFailed = 0
    let certificatesIssued = 0

    if (cohortId) {
      console.log(`[maintenance] [certificate-recalculation] Starting for cohort: ${cohortId}`)
      
      const { data: enrollments, error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .select('clerk_user_id')
        .eq('cohort_id', cohortId)
        .eq('status', 'active')

      if (enrollError) {
        console.error(`[maintenance] [certificate-recalculation] DB Error fetching enrollments:`, enrollError)
        return NextResponse.json({ error: 'Database error fetching enrollments' }, { status: 500 })
      }

      if (!enrollments || enrollments.length === 0) {
        return NextResponse.json({ error: 'No active students found in cohort' }, { status: 404 })
      }

      for (const enrollment of enrollments) {
        studentsProcessed++
        try {
          const certificateStatus = await calculateCertificateStatus(enrollment.clerk_user_id, cohortId)
          
          if (certificateStatus.eligible && !certificateStatus.issued) {
            const certificateId = crypto.randomUUID()
            const { error: insertError } = await supabaseAdmin.from('certificates').insert({
              id: certificateId,
              user_id: enrollment.clerk_user_id,
              cohort_id: cohortId,
              student_name: 'Student',
              issued_at: new Date().toISOString(),
            })

            if (insertError) {
              throw insertError
            }

            certificatesIssued++
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
          
          studentsSucceeded++
        } catch (error) {
          studentsFailed++
          console.error(`[maintenance] [certificate-recalculation] Error for user ${enrollment.clerk_user_id}:`, error)
          results.push({ 
            userId: enrollment.clerk_user_id, 
            status: 'error', 
            error: 'Failed to process certificate' 
          })
        }
      }

      const executionTimeMs = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        operation: 'certificate-recalculation',
        scope: 'cohort',
        cohortId,
        executionTimeMs,
        studentsProcessed,
        studentsSucceeded,
        studentsFailed,
        certificatesIssued,
        results 
      })
    } else {
      console.log(`[maintenance] [certificate-recalculation] Starting for all active cohorts`)
      const { data: cohorts, error: cohortError } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')

      if (cohortError) {
        console.error(`[maintenance] [certificate-recalculation] DB Error fetching cohorts:`, cohortError)
        return NextResponse.json({ error: 'Database error fetching cohorts' }, { status: 500 })
      }

      if (!cohorts || cohorts.length === 0) {
        return NextResponse.json({ error: 'No active cohorts found' }, { status: 404 })
      }

      for (const cohort of cohorts) {
        try {
          const { data: enrollments, error: enrollError } = await supabaseAdmin
            .from('enrollments')
            .select('clerk_user_id')
            .eq('cohort_id', cohort.id)
            .eq('status', 'active')

          if (enrollError) {
            console.error(`[maintenance] [certificate-recalculation] DB Error fetching enrollments for cohort ${cohort.id}:`, enrollError)
            continue
          }

          if (enrollments) {
            for (const enrollment of enrollments) {
              studentsProcessed++
              try {
                const certificateStatus = await calculateCertificateStatus(enrollment.clerk_user_id, cohort.id)
                
                if (certificateStatus.eligible && !certificateStatus.issued) {
                  const certificateId = crypto.randomUUID()
                  const { error: insertError } = await supabaseAdmin.from('certificates').insert({
                    id: certificateId,
                    user_id: enrollment.clerk_user_id,
                    cohort_id: cohort.id,
                    student_name: 'Student',
                    issued_at: new Date().toISOString(),
                  })

                  if (insertError) {
                    throw insertError
                  }
                  certificatesIssued++
                }
                
                studentsSucceeded++
              } catch (error) {
                studentsFailed++
                console.error(`[maintenance] [certificate-recalculation] Error for user ${enrollment.clerk_user_id}:`, error)
              }
            }
          }

          results.push({ 
            cohortId: cohort.id, 
            status: 'success', 
            students: enrollments?.length || 0 
          })
        } catch (error) {
          console.error(`[maintenance] [certificate-recalculation] Error for cohort ${cohort.id}:`, error)
          results.push({ 
            cohortId: cohort.id, 
            status: 'error', 
            error: 'Failed to process cohort' 
          })
        }
      }

      const executionTimeMs = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        operation: 'certificate-recalculation',
        scope: 'all-cohorts',
        executionTimeMs,
        studentsProcessed,
        studentsSucceeded,
        studentsFailed,
        certificatesIssued,
        results 
      })
    }
  } catch (error: any) {
    console.error('[maintenance] [certificate-recalculation] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
