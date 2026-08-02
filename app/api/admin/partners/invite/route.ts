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
    const { partnerEmail, partnerName, organization, partnerUserId } = body;

    if (!partnerEmail || !partnerName) {
      return NextResponse.json({ error: 'Missing partner email or name' }, { status: 400 });
    }

    const finalUserId = partnerUserId || crypto.randomUUID();

    const result = await AmbassadorService.inviteInfluencer({
      adminId,
      partnerEmail,
      partnerName,
      partnerUserId: finalUserId,
      organization
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, partner: result.partner });
  } catch (error) {
    console.error('[POST /api/admin/partners/invite] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
