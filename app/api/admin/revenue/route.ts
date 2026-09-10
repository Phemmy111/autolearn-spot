import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Placeholder data - replace with actual DB queries later
  const mockData = [
    { id: 1, name: 'Sample revenue entry 1', status: 'Active' },
    { id: 2, name: 'Sample revenue entry 2', status: 'Pending' }
  ];

  return NextResponse.json({ data: mockData });
}
