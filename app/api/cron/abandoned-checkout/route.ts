import { NextRequest, NextResponse } from 'next/server';
import { processAbandonedOrders } from '@/lib/abandoned-checkout';

export const dynamic = 'force-dynamic';

async function handleAbandonedRecovery(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const querySecret = searchParams.get('secret') || searchParams.get('key');
    const vercelCronHeader = request.headers.get('x-vercel-cron');

    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, allow matching Bearer token, matching query secret, or Vercel cron
    if (cronSecret) {
      const isBearerValid = authHeader === `Bearer ${cronSecret}`;
      const isQueryValid = querySecret === cronSecret;
      const isVercelValid = Boolean(vercelCronHeader);

      if (!isBearerValid && !isQueryValid && !isVercelValid) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid cron secret. Provide Authorization header or ?secret=...' },
          { status: 401 }
        );
      }
    }

    console.log('[Third-Party Cron] Running abandoned checkout recovery scan...');
    const result = await processAbandonedOrders({
      minAgeHours: 1, // Follow up 1 hour after checkout attempt
      maxAgeHours: 72, // Up to 3 days
      limit: 25,
    });

    console.log('[Third-Party Cron] Abandoned checkout recovery completed:', {
      scanned: result.scanned,
      sent: result.sent,
      skipped: result.skipped,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('[Third-Party Cron] Error running abandoned checkout process:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleAbandonedRecovery(request);
}

export async function POST(request: NextRequest) {
  return handleAbandonedRecovery(request);
}
