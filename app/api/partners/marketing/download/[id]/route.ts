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

    // Wait for params to resolve
    const resolvedParams = await params;
    console.log('[GET /api/partners/marketing/download/:id] Resolved params:', resolvedParams);

    // Get the marketing material
    const { data: material, error } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !material) {
      console.error('[GET /api/partners/marketing/download/:id] Material not found:', error);
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    console.log('[GET /api/partners/marketing/download/:id] Material found:', material.resource_url);

    // Increment download count
    await supabaseAdmin
      .from('partner_marketing_downloads')
      .update({ download_count: (material.download_count || 0) + 1 })
      .eq('id', resolvedParams.id);

    // Fetch the file and return with download headers
    const response = await fetch(material.resource_url);
    const blob = await response.blob();
    
    // Get filename from URL or use default
    const urlParts = material.resource_url.split('/');
    const filename = urlParts[urlParts.length - 1] || `marketing-material-${material.id}`;

    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[GET /api/partners/marketing/download/:id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}