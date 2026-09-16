import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { data: certificates, error } = await supabaseAdmin
      .from('certificates')
      .select('id, certificate_code, user_id, user_name, user_email, issued_at')
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
    }

    return NextResponse.json({ data: certificates });
  } catch (err) {
    console.error('Error fetching certificates:', err);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
