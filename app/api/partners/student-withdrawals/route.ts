import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { getPartnershipSettings } from '@/lib/partnership-settings';
import { getOrResolveAuthenticatedPartner } from '@/lib/partner-system/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const partner = await getOrResolveAuthenticatedPartner();
    if (!partner) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid withdrawal amount.' }, { status: 400 });
    }

    // Check minimum withdrawal amount from database settings
    const partnershipSettings = await getPartnershipSettings();
    const minWithdrawal = partnershipSettings.minWithdrawal || 1000;
    if (amount < minWithdrawal) {
      return NextResponse.json({ 
        error: `Minimum withdrawal amount is ₦${minWithdrawal.toLocaleString()}` 
      }, { status: 400 });
    }

    // Check available balance
    const available = Number(partner.available_earnings) || 0;
    if (available < amount) {
      return NextResponse.json({ 
        error: `Insufficient available balance (Available: ₦${available.toLocaleString()})` 
      }, { status: 400 });
    }

    // Get bank profile
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

    if (!bankProfile || !bankProfile.bank_name || !bankProfile.account_number) {
      return NextResponse.json({ 
        error: 'Bank details not found. Please save your payout account details first.' 
      }, { status: 400 });
    }

    // Create withdrawal request in author_withdrawals
    const reference = 'WD-STU-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('author_withdrawals')
      .insert({
        author_id: partner.id,
        amount: amount,
        status: 'PENDING',
        reference: reference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (withdrawalError || !withdrawal) {
      console.error('[student-withdrawals] Error creating withdrawal:', withdrawalError);
      return NextResponse.json({ error: 'Failed to create withdrawal request in database.' }, { status: 500 });
    }

    // Update partner's available earnings atomically
    const newAvailable = Math.max(0, available - amount);

    const { error: updateError } = await supabaseAdmin
      .from('partners')
      .update({
        available_earnings: newAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', partner.id);

    if (updateError) {
      console.error('[student-withdrawals] Error updating earnings:', updateError);
      await supabaseAdmin.from('author_withdrawals').delete().eq('id', withdrawal.id);
      return NextResponse.json({ error: 'Failed to update partner balance.' }, { status: 500 });
    }

    const partnerName = partner.name || 'Student Partner';

    // 1. Send confirmation email to student
    try {
      if (partner.email) {
        await PartnerEmailService.sendWithdrawalSubmittedEmail(
          partner.email,
          partnerName,
          amount
        );
      }
    } catch (studentMailErr) {
      console.warn('[student-withdrawals] Student email warning:', studentMailErr);
    }

    // 2. Send admin notification about withdrawal request to autolearnspot@gmail.com
    try {
      await PartnerEmailService.sendAdminWithdrawalNotification(
        'autolearnspot@gmail.com',
        partnerName,
        amount,
        withdrawal.id
      );
    } catch (adminMailErr) {
      console.warn('[student-withdrawals] Admin email warning:', adminMailErr);
    }

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    console.error('[POST /api/partners/student-withdrawals] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
