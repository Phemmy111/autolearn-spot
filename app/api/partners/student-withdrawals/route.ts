import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get student partner
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('partner_type', 'student')
      .eq('status', 'active')
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Check available balance
    if (partner.available_earnings < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Get bank profile
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .single();

    if (!bankProfile) {
      return NextResponse.json({ error: 'Bank profile not found. Please add your bank details first.' }, { status: 400 });
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        partner_id: partner.id,
        amount: amount,
        status: 'pending',
        bank_name: bankProfile.bank_name,
        account_number: bankProfile.account_number,
        account_name: bankProfile.account_name,
        account_type: bankProfile.account_type || 'savings'
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal:', withdrawalError);
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 });
    }

    // Update partner's available earnings
    const { error: updateError } = await supabaseAdmin
      .from('partners')
      .update({
        available_earnings: partner.available_earnings - amount,
        pending_earnings: partner.pending_earnings + amount
      })
      .eq('id', partner.id);

    if (updateError) {
      console.error('Error updating partner earnings:', updateError);
      // Rollback withdrawal
      await supabaseAdmin.from('withdrawals').delete().eq('id', withdrawal.id);
      return NextResponse.json({ error: 'Failed to update earnings' }, { status: 500 });
    }

    // Send admin notification about withdrawal request
    try {
      await PartnerEmailService.sendAdminWithdrawalNotification(
        'femiadeleke2020@gmail.com',
        partner.full_name,
        amount,
        withdrawal.id
      );
    } catch (emailError) {
      console.error('Error sending admin withdrawal notification:', emailError);
      // Don't fail the withdrawal if email fails
    }

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    console.error('[POST /api/partners/student-withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
