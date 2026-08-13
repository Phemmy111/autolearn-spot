import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';
    const position = searchParams.get('position');

    let query = supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (enabledOnly) {
      query = query.eq('enabled', true);
    }

    if (position) {
      query = query.eq('display_position', position);
    }

    const { data: announcements, error } = await query;

    if (error) throw error;

    // Filter by date if enabled
    const now = new Date();
    const filteredAnnouncements = (announcements || []).filter(announcement => {
      if (!enabledOnly) return true;
      
      const startDate = announcement.start_date ? new Date(announcement.start_date) : null;
      const endDate = announcement.end_date ? new Date(announcement.end_date) : null;
      
      if (startDate && now < startDate) return false;
      if (endDate && now > endDate) return false;
      
      return true;
    });

    return NextResponse.json({ success: true, announcements: filteredAnnouncements });
  } catch (error) {
    console.error('[GET /api/content/announcements] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}