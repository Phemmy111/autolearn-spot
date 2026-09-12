import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { linkAuthorProfile } from '@/lib/author';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email from Clerk
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Try to link author profile
    const linked = await linkAuthorProfile(userId, email);

    return NextResponse.json({
      success: true,
      linked,
      message: linked
        ? 'Author profile linked successfully'
        : 'No pending author profile found for this email',
    });
  } catch (error) {
    console.error('Error in author account linking API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
