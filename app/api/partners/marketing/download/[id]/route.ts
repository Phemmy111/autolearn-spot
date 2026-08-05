import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check session
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the marketing material
    const { data: material, error } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Increment download count
    await supabaseAdmin
      .from('partner_marketing_downloads')
      .update({ download_count: (material.download_count || 0) + 1 })
      .eq('id', params.id);

    // Redirect to the file URL
    return NextResponse.redirect(material.resource_url);
  } catch (error) {
    console.error('[GET /api/partners/marketing/download/:id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}