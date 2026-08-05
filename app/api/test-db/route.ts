import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key exists:', !!supabaseServiceKey);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('pending_enrollments')
      .select('count')
      .limit(1);

    console.log('Test query result:', testData);
    console.log('Test query error:', testError);

    if (testError) {
      console.error('Database connection failed:', testError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError,
        tables: {
          pending_enrollments: 'Error accessing table'
        }
      });
    }

    // Check if table exists by trying to describe it
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'pending_enrollments' })
      .catch(() => ({ data: null, error: { message: 'RPC function not available' } }));

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tables: {
        pending_enrollments: tableError ? 'Cannot verify structure' : 'Accessible'
      },
      testQuery: testData,
      tableInfo: tableInfo
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}