import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
import { processWithdrawal } from '@/lib/authorService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/withdrawals
 * Returns all pending withdrawals (status = 'PENDING').
 * Admin‑only.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { data: pending, error } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*, authors(display_name, user_id)')
      .eq('status', 'PENDING');
      
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return NextResponse.json({ success: true, withdrawals: pending || [] });
  } catch (e: any) {
    console.error('[GET /api/admin/withdrawals] error:', e);
    return NextResponse.json({ error: 'Unauthorized or internal error' }, { status: 403 });
  }
}

/**
 * POST /api/admin/withdrawals
 * Body: { withdrawal_id: string, action: 'approve' | 'reject', provider_reference?: string }
 * Calls authorService.processWithdrawal to transition state.
 * Admin‑only.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { withdrawal_id, action, provider_reference } = body;
    
    if (!withdrawal_id || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : null;
    if (!newStatus) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    await processWithdrawal(withdrawal_id, newStatus, provider_reference);
    
    return NextResponse.json({ success: true, withdrawal_id, newStatus });
  } catch (e: any) {
    console.error('[POST /api/admin/withdrawals] error:', e);
    return NextResponse.json({ error: e.message || 'Unauthorized or internal error' }, { status: 403 });
  }
}
