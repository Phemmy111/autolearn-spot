import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test if we can access the author
    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .select('*')
      .eq('id', '8a07dde8-9200-4113-ab20-5adc7002e6f0')
      .single();

    return NextResponse.json({
      success: true,
      author: author,
      error: error?.message,
      authorExists: !!author
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
