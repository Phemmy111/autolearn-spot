import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { AmbassadorService } from '@/lib/growth-engine/AmbassadorService';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { partnerEmail, partnerName, institution, partnerUserId } = body;

    if (!partnerEmail || !partnerName) {
      return NextResponse.json({ error: 'Missing partner email or name' }, { status: 400 });
    }

    // In a real flow, if the user doesn't exist, we might create a Clerk account or use a placeholder ID
    // For this milestone, we accept partnerUserId if provided, or generate a placeholder UUID
    const finalUserId = partnerUserId || crypto.randomUUID();

    const result = await AmbassadorService.invitePartner({
      adminId,
      partnerEmail,
      partnerName,
      partnerUserId: finalUserId,
      institution
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, ambassador: result.ambassador });
  } catch (error) {
    console.error('[POST /api/admin/ambassadors/invite] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
