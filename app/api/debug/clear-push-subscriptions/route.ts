import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return await handleClearSubscriptions();
}

export async function POST(request: Request) {
  return await handleClearSubscriptions();
}

async function handleClearSubscriptions() {
  try {
    // Delete all push subscriptions
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All push subscriptions cleared. Users will need to re-subscribe.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
