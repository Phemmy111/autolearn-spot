import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { courseSlug, lessonId } = body

    if (!courseSlug || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required parameters: courseSlug and lessonId are required.' },
        { status: 400 }
      )
    }

    // 1. Fetch course settings from site_settings
    const finalLessonKey = `final_lesson_id:${courseSlug}`
    const certEnabledKey = `certificate_enabled:${courseSlug}`

    const { data: finalSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', finalLessonKey)
      .single()

    const { data: certSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', certEnabledKey)
      .single()

    // Fall back to global certificate_enabled if course-specific key is absent
    let certificateEnabled = certSetting?.value
    if (certificateEnabled === undefined || certificateEnabled === null) {
      const { data: globalCertSetting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'certificate_enabled')
        .single()
      certificateEnabled = globalCertSetting?.value ?? false
    }

    const isEnabled = certificateEnabled === true || certificateEnabled === 'true'
    if (!isEnabled) {
      return NextResponse.json(
        { error: 'Certificates are not enabled for this course.' },
        { status: 400 }
      )
    }

    const configuredFinalLessonId = finalSetting?.value
    if (configuredFinalLessonId && configuredFinalLessonId !== lessonId) {
      return NextResponse.json(
        { error: `Submitted lesson (${lessonId}) does not match the configured final lesson (${configuredFinalLessonId}).` },
        { status: 400 }
      )
    }

    // 2. Fetch User Details
    const user = await currentUser()
    const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Student'
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || ''

    // Get default cohort ID or fallback UUID
    const { data: currentCohort } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('is_current', true)
      .single()

    const cohortId = currentCohort?.id || 'a1111111-1111-1111-1111-111111111111'

    // 3. Upsert student certificate record
    const certCode = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    
    // Check if certificate already exists
    const { data: existingCert } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('user_id', userId)
      .single()

    let certificateRecord = existingCert

    if (!existingCert) {
      const { data: newCert, error: certErr } = await supabaseAdmin
        .from('certificates')
        .upsert(
          {
            cohort_id: cohortId,
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            certificate_code: certCode,
            issued_at: new Date().toISOString(),
          },
          { onConflict: 'cohort_id,user_id' }
        )
        .select()
        .single()

      if (certErr) {
        console.error('Error recording certificate completion:', certErr)
      } else {
        certificateRecord = newCert
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course completed and certificate unlocked!',
      certificate: certificateRecord || {
        user_id: userId,
        user_name: userName,
        completed: true,
      },
      downloadUrl: `/api/certificate/download?format=pdf`,
    })
  } catch (error) {
    console.error('Error in /api/certificate/complete:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
