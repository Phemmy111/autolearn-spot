import { NextRequest, NextResponse } from 'next/server';
import { PartnerMarketingService } from '@/lib/partner-system/PartnerMarketingService';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (type) {
      const resources = await PartnerMarketingService.getResourcesByType(type);
      return NextResponse.json({ success: true, resources });
    }

    const resources = await PartnerMarketingService.getMarketingResources();
    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error('Error getting marketing resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceType, resourceName, resourceUrl } = await request.json();

    if (!resourceType || !resourceName || !resourceUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get partner ID from user ID
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const recorded = await PartnerMarketingService.recordDownload(
      partner.id,
      resourceType,
      resourceName,
      resourceUrl
    );

    if (!recorded) {
      return NextResponse.json({ error: 'Failed to record download' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}