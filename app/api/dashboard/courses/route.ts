import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserEnrollments } from '@/lib/enrollment-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const primaryEmail = user.primaryEmailAddress?.emailAddress || '';

    // getUserEnrollments now handles the auto-linking and expiry checks
    const enrollments = await getUserEnrollments(userId, primaryEmail);

    // Show both active and not-started enrollments (exclude expired)
    const activeEnrollments = enrollments.filter((e: any) => e.status === 'active' || e.status === 'not_started');

    const formattedCourses = activeEnrollments
      .filter((e: any) => e.learning_product)
      .map((e: any) => ({
        enrollment_id: e.id,
        enrolled_at: e.activated_at,
        course: Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product
      }));

    return NextResponse.json({ success: true, courses: formattedCourses });
  } catch (error: any) {
    console.error('Dashboard courses API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
