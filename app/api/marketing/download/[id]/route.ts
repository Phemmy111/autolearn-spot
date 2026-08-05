import { NextResponse } from 'next/server';
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
    // Wait for params to resolve
    const resolvedParams = await params;
    console.log('[GET /api/marketing/download/:id] Resolved params:', resolvedParams);

    // Get the marketing material
    const { data: material, error } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !material) {
      console.error('[GET /api/marketing/download/:id] Material not found:', error);
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    console.log('[GET /api/marketing/download/:id] Material found:', material.resource_url);

    // Increment download count
    await supabaseAdmin
      .from('partner_marketing_downloads')
      .update({ download_count: (material.download_count || 0) + 1 })
      .eq('id', resolvedParams.id);

    // Redirect to the file URL
    return NextResponse.redirect(material.resource_url);
  } catch (error) {
    console.error('[GET /api/marketing/download/:id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}