import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerWithdrawalService } from '@/lib/partner-system/PartnerWithdrawalService';
import { getPartnershipSettings } from '@/lib/partnership-settings';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

async function resolvePartner(): Promise<any | null> {
  // 1. SessionService check (used by OTP login)
  try {
    const session = await SessionService.getSession();
    if (session?.userId) {
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('*')
        .or(`id.eq.${session.userId},user_id.eq.${session.userId},partner_id.eq.${session.userId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (partner) return partner;
    }
  } catch (err) {
    console.warn('[withdrawals] Session lookup warning:', err);
  }

  // 2. Clerk auth check (fallback)
  try {
    const { userId } = await auth();
    if (userId) {
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('*')
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .maybeSingle();

      if (partner) return partner;
    }
  } catch (err) {
    console.warn('[withdrawals] Clerk lookup warning:', err);
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const partner = await resolvePartner();
    if (!partner) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to your partner account.' }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid withdrawal amount.' }, { status: 400 });
    }

    // Minimum withdrawal threshold check
    const settings = await getPartnershipSettings();
    const minWithdrawal = settings.minWithdrawal || 1000;
    if (amount < minWithdrawal) {
      return NextResponse.json({ 
        error: `Minimum withdrawal amount is ₦${minWithdrawal.toLocaleString()}` 
      }, { status: 400 });
    }

    // Balance check
    const currentAvailable = Number(partner.available_earnings) || 0;
    if (amount > currentAvailable) {
      return NextResponse.json({ 
        error: `Insufficient available balance. You have ₦${currentAvailable.toLocaleString()} available.` 
      }, { status: 400 });
    }

    // Get verified bank profile
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

    if (!bankProfile || !bankProfile.bank_name || !bankProfile.account_number) {
      return NextResponse.json({ 
        error: 'Bank profile not found. Please set up your bank account details before requesting a withdrawal.' 
      }, { status: 400 });
    }

    // Submit withdrawal using service
    const result = await PartnerWithdrawalService.createWithdrawal(
      partner.id,
      amount,
      bankProfile.bank_name,
      bankProfile.account_number,
      bankProfile.account_name
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to submit withdrawal' }, { status: 400 });
    }

    // Fire-and-forget email notifications
    try {
      const smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const fromAddress = `"AutoLearn Spot" <${process.env.SMTP_USER}>`;
      const partnerName = partner.name || partner.full_name || 'Partner';

      // 1. Email to partner
      if (partner.email) {
        smtpTransporter.sendMail({
          from: fromAddress,
          to: partner.email,
          subject: `Withdrawal Request Received — ₦${amount.toLocaleString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #059669;">Withdrawal Request Received</h2>
              <p>Hi ${partnerName},</p>
              <p>Your withdrawal request of <strong>₦${amount.toLocaleString()}</strong> has been submitted and is currently being processed.</p>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 4px 0;"><strong>Bank:</strong> ${bankProfile.bank_name}</p>
                <p style="margin: 4px 0;"><strong>Account Number:</strong> ${bankProfile.account_number}</p>
                <p style="margin: 4px 0;"><strong>Account Name:</strong> ${bankProfile.account_name}</p>
              </div>
              <p>Payouts are typically processed to your bank within <strong>24–48 hours</strong>.</p>
              <p>Best regards,<br>The AutoLearn Spot Team</p>
            </div>
          `,
        }).catch((err) => console.warn('[Withdrawal Email] Partner email warning:', err));
      }

      // 2. Email to founder/admin
      const founderEmail = process.env.FOUNDER_EMAIL || 'femiadeleke2020@gmail.com';
      smtpTransporter.sendMail({
        from: fromAddress,
        to: founderEmail,
        subject: `New Partner Withdrawal Request: ₦${amount.toLocaleString()} from ${partnerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">New Partner Payout Request</h2>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;"><strong>Partner:</strong> ${partnerName} (${partner.partner_id || partner.id})</p>
              <p style="margin: 4px 0;"><strong>Email:</strong> ${partner.email}</p>
              <p style="margin: 4px 0;"><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>Bank:</strong> ${bankProfile.bank_name}</p>
              <p style="margin: 4px 0;"><strong>Account:</strong> ${bankProfile.account_number} (${bankProfile.account_name})</p>
            </div>
            <p>Please log in to the admin panel to review and approve this payout.</p>
          </div>
        `,
      }).catch((err) => console.warn('[Withdrawal Email] Founder email warning:', err));
    } catch (mailErr) {
      console.warn('[Withdrawal Email] Setup error:', mailErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully!',
      withdrawal: result.withdrawal 
    });
  } catch (error: any) {
    console.error('[POST /api/partners/withdrawals] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const partner = await resolvePartner();
    if (!partner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch withdrawals from author_withdrawals (which PartnerWithdrawalService uses)
    const { data: authorWithdrawals, error: wdError } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .eq('author_id', partner.id)
      .order('created_at', { ascending: false });

    // Also check partner_withdrawals for backwards compatibility
    const { data: legacyWithdrawals } = await supabaseAdmin
      .from('partner_withdrawals')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    // Combine & format
    const combined = [
      ...(authorWithdrawals || []).map((w) => ({
        id: w.id,
        amount: Number(w.amount) || 0,
        status: (w.status || 'PENDING').toLowerCase(),
        reference: w.reference || w.id.slice(0, 8),
        created_at: w.created_at,
        updated_at: w.updated_at
      })),
      ...(legacyWithdrawals || []).map((w) => ({
        id: w.id,
        amount: Number(w.amount) || 0,
        status: (w.status || 'pending').toLowerCase(),
        reference: w.reference || w.id.slice(0, 8),
        created_at: w.created_at,
        updated_at: w.updated_at
      }))
    ];

    return NextResponse.json({ 
      success: true, 
      withdrawals: combined 
    });
  } catch (error: any) {
    console.error('[GET /api/partners/withdrawals] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
