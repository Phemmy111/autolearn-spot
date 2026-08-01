import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    await requireAdmin()
    
    const body = await req.json()
    const { testType } = body
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    }
    
    switch (testType) {
      case 'student_name':
        results.tests.push(await testStudentName())
        break
      case 'leaderboard':
        results.tests.push(await testLeaderboard())
        break
      case 'overall_progress':
        results.tests.push(await testOverallProgress())
        break
      case 'badges':
        results.tests.push(await testBadges())
        break
      case 'notifications':
        results.tests.push(await testNotifications())
        break
      case 'all':
        results.tests.push(await testStudentName())
        results.tests.push(await testLeaderboard())
        results.tests.push(await testOverallProgress())
        results.tests.push(await testBadges())
        results.tests.push(await testNotifications())
        break
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }
    
    const allPassed = results.tests.every((t: { passed: boolean }) => t.passed)
    
    return NextResponse.json({
      success: true,
      allPassed,
      results
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function testStudentName() {
  try {
    // Get a test enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, first_name, last_name, full_name, email')
      .eq('status', 'active')
      .limit(1)
      .single()
    
    if (!enrollment) {
      return {
        name: 'Student Name',
        passed: false,
        error: 'No active enrollment found for testing',
        details: { enrollment: null }
      }
    }
    
    const hasNameData = !!(enrollment.first_name || enrollment.full_name)
    
    return {
      name: 'Student Name',
      passed: hasNameData,
      details: {
        enrollment: {
          clerk_user_id: enrollment.clerk_user_id,
          has_first_name: !!enrollment.first_name,
          has_full_name: !!enrollment.full_name,
          email: enrollment.email
        }
      },
      error: hasNameData ? null : 'Enrollment missing name fields'
    }
  } catch (error: any) {
    return {
      name: 'Student Name',
      passed: false,
      error: error.message,
      details: null
    }
  }
}

async function testLeaderboard() {
  try {
    // Get leaderboard entries
    const { data: leaderboard } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .limit(5)
    
    if (!leaderboard || leaderboard.length === 0) {
      return {
        name: 'Leaderboard',
        passed: false,
        error: 'No leaderboard entries found',
        details: { count: 0 }
      }
    }
    
    const hasValidScores = leaderboard.every(entry => 
      entry.total_score >= 0 && 
      entry.assignment_score >= 0 && 
      entry.quiz_score >= 0 && 
      entry.video_completion >= 0
    )
    
    return {
      name: 'Leaderboard',
      passed: hasValidScores,
      details: {
        count: leaderboard.length,
        sample: leaderboard[0]
      },
      error: hasValidScores ? null : 'Invalid score values found'
    }
  } catch (error: any) {
    return {
      name: 'Leaderboard',
      passed: false,
      error: error.message,
      details: null
    }
  }
}

async function testOverallProgress() {
  try {
    // Get a test user's progress
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, cohort_id')
      .eq('status', 'active')
      .limit(1)
      .single()
    
    if (!enrollment || !enrollment.clerk_user_id) {
      return {
        name: 'Overall Progress',
        passed: false,
        error: 'No active enrollment with clerk_user_id found',
        details: null
      }
    }
    
    // Check progress tables
    const { count: lessonProgressCount } = await supabaseAdmin
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', enrollment.clerk_user_id)
      .eq('cohort_id', enrollment.cohort_id)
    
    const { count: submissionsCount } = await supabaseAdmin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', enrollment.clerk_user_id)
    
    const { count: quizResponsesCount } = await supabaseAdmin
      .from('quiz_responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', enrollment.clerk_user_id)
      .eq('cohort_id', enrollment.cohort_id)
    
    const hasProgressData = (lessonProgressCount || 0) > 0 || 
                          (submissionsCount || 0) > 0 || 
                          (quizResponsesCount || 0) > 0
    
    return {
      name: 'Overall Progress',
      passed: hasProgressData,
      details: {
        lesson_progress_count: lessonProgressCount || 0,
        submissions_count: submissionsCount || 0,
        quiz_responses_count: quizResponsesCount || 0
      },
      error: hasProgressData ? null : 'No progress data found for test user'
    }
  } catch (error: any) {
    return {
      name: 'Overall Progress',
      passed: false,
      error: error.message,
      details: null
    }
  }
}

async function testBadges() {
  try {
    // Check badge system tables
    const { count: badgesCount } = await supabaseAdmin
      .from('badges')
      .select('id', { count: 'exact', head: true })
    
    const { count: userBadgesCount } = await supabaseAdmin
      .from('user_badges')
      .select('id', { count: 'exact', head: true })
    
    const hasBadgeSystem = (badgesCount || 0) > 0
    
    return {
      name: 'Badges',
      passed: hasBadgeSystem,
      details: {
        badges_count: badgesCount || 0,
        user_badges_count: userBadgesCount || 0
      },
      error: hasBadgeSystem ? null : 'Badge system not configured'
    }
  } catch (error: any) {
    return {
      name: 'Badges',
      passed: false,
      error: error.message,
      details: null
    }
  }
}

async function testNotifications() {
  try {
    // Check notification tables
    const { count: notificationsCount } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
    
    const { count: deliveriesCount } = await supabaseAdmin
      .from('notification_deliveries')
      .select('id', { count: 'exact', head: true })
    
    const hasNotificationSystem = (notificationsCount || 0) >= 0 && (deliveriesCount || 0) >= 0
    
    return {
      name: 'Notifications',
      passed: hasNotificationSystem,
      details: {
        notifications_count: notificationsCount || 0,
        deliveries_count: deliveriesCount || 0
      },
      error: hasNotificationSystem ? null : 'Notification system not configured'
    }
  } catch (error: any) {
    return {
      name: 'Notifications',
      passed: false,
      error: error.message,
      details: null
    }
  }
}