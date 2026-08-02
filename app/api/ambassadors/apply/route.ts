import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { AmbassadorService } from '@/lib/growth-engine/AmbassadorService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress || '';
    const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown';

    const body = await request.json();
    const {
      phone,
      institution,
      campusLocation,
      studentId,
      levelOfStudy,
      courseOfStudy,
      graduationYear,
      motivation,
      marketingPlan,
      socialMediaLinks
    } = body;

    if (!phone || !institution || !campusLocation || !motivation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await AmbassadorService.applyForAmbassador({
      userId,
      userEmail,
      userName,
      phone,
      institution,
      campusLocation,
      studentId,
      levelOfStudy,
      courseOfStudy,
      graduationYear,
      motivation,
      marketingPlan,
      socialMediaLinks
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, application: result.application });
  } catch (error) {
    console.error('[POST /api/ambassadors/apply] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
