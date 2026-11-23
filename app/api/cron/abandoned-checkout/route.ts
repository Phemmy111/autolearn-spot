import { NextRequest, NextResponse } from 'next/server';
import { processAbandonedOrders } from '@/lib/abandoned-checkout';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, check authorization header
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow internal calls or Vercel cron header
      const vercelCronHeader = request.headers.get('x-vercel-cron');
      if (!vercelCronHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron] Running abandoned checkout recovery scan...');
    const result = await processAbandonedOrders({
      minAgeHours: 1, // Follow up 1 hour after abandoned attempt
      maxAgeHours: 72, // Up to 3 days
      limit: 20,
    });

    console.log('[Cron] Abandoned checkout recovery completed:', {
      scanned: result.scanned,
      sent: result.sent,
      skipped: result.skipped,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Cron] Error running abandoned checkout process:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
