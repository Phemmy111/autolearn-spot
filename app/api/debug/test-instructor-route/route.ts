import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Instructor route API is working',
    timestamp: new Date().toISOString()
  });
}
