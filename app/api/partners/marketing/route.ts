import { NextRequest, NextResponse } from 'next/server';
import { PartnerMarketingService } from '@/lib/partner-system/PartnerMarketingService';
import { getOrResolveAuthenticatedPartner } from '@/lib/partner-system/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const partner = await getOrResolveAuthenticatedPartner();
    if (!partner) {
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
    const partner = await getOrResolveAuthenticatedPartner();
    if (!partner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceType, resourceName, resourceUrl } = await request.json();

    if (!resourceType || !resourceName || !resourceUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
