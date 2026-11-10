import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 1. Fetch all enrollments
    const { data: rawEnrollments, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('id, full_name, email, clerk_user_id, learning_product_id, cohort_id, status, enrolled_at, activated_at')
      .order('enrolled_at', { ascending: false });

    if (enrollError) {
      console.error('[Admin Activities] Error fetching enrollments:', enrollError);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    // 2. Fetch all learning products (courses)
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, thumbnail_url');

    const productMap = new Map((products || []).map(p => [p.id, p]));

    // 3. Fetch all lessons to compute course lesson counts
    const { data: allLessons } = await supabaseAdmin
      .from('lessons')
      .select('id, uuid_id, product_id, cohort_id, title, order_index')
      .order('order_index', { ascending: true });

    // Group lessons by product_id
    const lessonsByProduct = new Map<string, any[]>();
    (allLessons || []).forEach(l => {
      const pId = l.product_id;
      if (pId) {
        const list = lessonsByProduct.get(pId) || [];
        list.push(l);
        lessonsByProduct.set(pId, list);
      }
    });

    // 4. Fetch all lesson progress
    const { data: allProgress } = await supabaseAdmin
      .from('lesson_progress')
      .select('id, user_id, lesson_uuid_id, completed, watch_pct, last_position_seconds, updated_at');

    // 5. Fetch all issued certificates
    const { data: allCerts } = await supabaseAdmin
      .from('certificates')
      .select('id, user_id, user_name, user_email, course_title, learning_product_id, certificate_code, issued_at');

    // Also fetch paid orders to catch any purchaser not yet in enrollments
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        product_id,
        product_title,
        created_at,
        orders!inner(
          id,
          user_id,
          customer_name,
          customer_email,
          status
        )
      `)
      .eq('orders.status', 'PAID')
      .order('created_at', { ascending: false });

    // Build unified student activities map
    const studentActivities: any[] = [];
    const seenStudentCourseKeys = new Set<string>();

    const safeEnrollments = rawEnrollments || [];

    for (const enr of safeEnrollments) {
      const courseId = enr.learning_product_id;
      const studentEmail = (enr.email || '').toLowerCase().trim();
      const clerkId = enr.clerk_user_id || '';
      const key = `${clerkId || studentEmail}_${courseId}`;
      seenStudentCourseKeys.add(key);

      const product = productMap.get(courseId);
      const courseTitle = product?.title || 'Course';
      const courseLessons = (courseId ? lessonsByProduct.get(courseId) : []) || [];
      const totalLessonsCount = courseLessons.length;

      // Filter progress for this student
      // Student can have user_id equal to clerk_user_id, or email
      const studentProgress = (allProgress || []).filter(p => 
        (clerkId && p.user_id === clerkId) || 
        (studentEmail && p.user_id?.toLowerCase() === studentEmail)
      );

      // Map progress by lesson_uuid_id
      const progressByLesson = new Map<string, any>();
      studentProgress.forEach(p => {
        if (p.lesson_uuid_id) progressByLesson.set(p.lesson_uuid_id, p);
      });

      // Calculate completed lessons and latest activity
      let completedLessonsCount = 0;
      let latestActiveAt = enr.activated_at || enr.enrolled_at;
      let currentLessonTitle: string | null = null;

      // Sort student progress by updated_at descending to find last active lesson
      const sortedProgress = [...studentProgress].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      if (sortedProgress.length > 0) {
        latestActiveAt = sortedProgress[0].updated_at;
        const lastLesson = courseLessons.find(l => l.uuid_id === sortedProgress[0].lesson_uuid_id || l.id === sortedProgress[0].lesson_uuid_id);
        if (lastLesson) {
          currentLessonTitle = lastLesson.title;
        }
      }

      // Check which course lessons are completed
      const lessonsBreakdown = courseLessons.map(l => {
        const prog = progressByLesson.get(l.uuid_id) || progressByLesson.get(l.id);
        const isCompleted = prog?.completed === true || (prog?.watch_pct && prog.watch_pct >= 90);
        if (isCompleted) completedLessonsCount++;
        return {
          id: l.id,
          uuid_id: l.uuid_id,
          title: l.title,
          order_index: l.order_index,
          completed: !!isCompleted,
          watch_pct: prog?.watch_pct || (isCompleted ? 100 : 0),
          last_active: prog?.updated_at || null,
        };
      });

      const progressPct = totalLessonsCount > 0 
        ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100))
        : (enr.status === 'completed' ? 100 : 0);

      // Determine learning status
      let learningStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
      if (completedLessonsCount > 0 || studentProgress.length > 0) {
        if (progressPct >= 100 || (totalLessonsCount > 0 && completedLessonsCount >= totalLessonsCount)) {
          learningStatus = 'completed';
        } else {
          learningStatus = 'in_progress';
        }
      }

      // Check certificate
      const matchedCert = (allCerts || []).find(c => 
        (courseId && c.learning_product_id === courseId) &&
        ((studentEmail && c.user_email?.toLowerCase() === studentEmail) || (clerkId && c.user_id === clerkId))
      ) || (allCerts || []).find(c => 
        (studentEmail && c.user_email?.toLowerCase() === studentEmail) &&
        (c.course_title && courseTitle && c.course_title.toLowerCase().includes(courseTitle.toLowerCase()))
      );

      studentActivities.push({
        id: enr.id,
        student_name: enr.full_name || 'Enrolled Student',
        student_email: enr.email,
        clerk_user_id: enr.clerk_user_id,
        course_id: courseId,
        course_title: courseTitle,
        course_thumbnail: product?.thumbnail_url || null,
        enrollment_status: enr.status,
        enrolled_at: enr.enrolled_at,
        activated_at: enr.activated_at,
        latest_active_at: latestActiveAt,
        learning_status: learningStatus,
        progress_pct: progressPct,
        completed_lessons_count: completedLessonsCount,
        total_lessons_count: totalLessonsCount,
        current_lesson_title: currentLessonTitle || (courseLessons[0]?.title ?? 'Lesson 1'),
        certificate_earned: !!matchedCert,
        certificate: matchedCert ? {
          id: matchedCert.id,
          code: matchedCert.certificate_code,
          issued_at: matchedCert.issued_at,
          verify_url: `/verify/certificate/${matchedCert.certificate_code}`,
        } : null,
        lessons: lessonsBreakdown,
      });
    }

    // Process any paid order items not found in enrollments
    for (const item of (orderItems || [])) {
      const order = (item as any).orders;
      if (!order) continue;

      const courseId = item.product_id;
      const studentEmail = (order.customer_email || '').toLowerCase().trim();
      const clerkId = order.user_id || '';
      const key = `${clerkId || studentEmail}_${courseId}`;

      if (seenStudentCourseKeys.has(key)) continue;
      seenStudentCourseKeys.add(key);

      const product = productMap.get(courseId);
      const courseTitle = item.product_title || product?.title || 'Course';
      const courseLessons = (courseId ? lessonsByProduct.get(courseId) : []) || [];
      const totalLessonsCount = courseLessons.length;

      const studentProgress = (allProgress || []).filter(p => 
        (clerkId && p.user_id === clerkId) || 
        (studentEmail && p.user_id?.toLowerCase() === studentEmail)
      );

      const progressByLesson = new Map<string, any>();
      studentProgress.forEach(p => {
        if (p.lesson_uuid_id) progressByLesson.set(p.lesson_uuid_id, p);
      });

      let completedLessonsCount = 0;
      let latestActiveAt = item.created_at;
      let currentLessonTitle: string | null = null;

      const sortedProgress = [...studentProgress].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      if (sortedProgress.length > 0) {
        latestActiveAt = sortedProgress[0].updated_at;
        const lastLesson = courseLessons.find(l => l.uuid_id === sortedProgress[0].lesson_uuid_id || l.id === sortedProgress[0].lesson_uuid_id);
        if (lastLesson) currentLessonTitle = lastLesson.title;
      }

      const lessonsBreakdown = courseLessons.map(l => {
        const prog = progressByLesson.get(l.uuid_id) || progressByLesson.get(l.id);
        const isCompleted = prog?.completed === true || (prog?.watch_pct && prog.watch_pct >= 90);
        if (isCompleted) completedLessonsCount++;
        return {
          id: l.id,
          uuid_id: l.uuid_id,
          title: l.title,
          order_index: l.order_index,
          completed: !!isCompleted,
          watch_pct: prog?.watch_pct || (isCompleted ? 100 : 0),
          last_active: prog?.updated_at || null,
        };
      });

      const progressPct = totalLessonsCount > 0 
        ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100))
        : 0;

      let learningStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
      if (completedLessonsCount > 0 || studentProgress.length > 0) {
        if (progressPct >= 100) learningStatus = 'completed';
        else learningStatus = 'in_progress';
      }

      const matchedCert = (allCerts || []).find(c => 
        (courseId && c.learning_product_id === courseId) &&
        ((studentEmail && c.user_email?.toLowerCase() === studentEmail) || (clerkId && c.user_id === clerkId))
      );

      studentActivities.push({
        id: `ord_${item.id}`,
        student_name: order.customer_name || 'Paid Student',
        student_email: order.customer_email,
        clerk_user_id: order.user_id,
        course_id: courseId,
        course_title: courseTitle,
        course_thumbnail: product?.thumbnail_url || null,
        enrollment_status: 'active',
        enrolled_at: item.created_at,
        activated_at: item.created_at,
        latest_active_at: latestActiveAt,
        learning_status: learningStatus,
        progress_pct: progressPct,
        completed_lessons_count: completedLessonsCount,
        total_lessons_count: totalLessonsCount,
        current_lesson_title: currentLessonTitle || (courseLessons[0]?.title ?? 'Lesson 1'),
        certificate_earned: !!matchedCert,
        certificate: matchedCert ? {
          id: matchedCert.id,
          code: matchedCert.certificate_code,
          issued_at: matchedCert.issued_at,
          verify_url: `/verify/certificate/${matchedCert.certificate_code}`,
        } : null,
        lessons: lessonsBreakdown,
      });
    }

    // Compute Summary Metrics
    const totalEnrollments = studentActivities.length;
    const uniqueStudents = new Set(studentActivities.map(a => a.student_email || a.clerk_user_id)).size;
    const startedCount = studentActivities.filter(a => a.learning_status !== 'not_started').length;
    const completedCount = studentActivities.filter(a => a.learning_status === 'completed').length;
    const certifiedCount = studentActivities.filter(a => a.certificate_earned).length;
    const inProgressCount = studentActivities.filter(a => a.learning_status === 'in_progress').length;
    const notStartedCount = studentActivities.filter(a => a.learning_status === 'not_started').length;

    const avgProgress = totalEnrollments > 0
      ? Math.round(studentActivities.reduce((acc, a) => acc + a.progress_pct, 0) / totalEnrollments)
      : 0;

    return NextResponse.json({
      success: true,
      activities: studentActivities,
      metrics: {
        totalEnrollments,
        uniqueStudents,
        startedCount,
        inProgressCount,
        notStartedCount,
        completedCount,
        certifiedCount,
        averageProgress: avgProgress,
      }
    });
  } catch (error) {
    console.error('[Admin Activities] Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
