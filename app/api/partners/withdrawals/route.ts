import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerWithdrawalService } from '@/lib/partner-system/PartnerWithdrawalService';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Flat partner lookup — supports all partner types (affiliate, community, influencer, etc.)
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('*')
      .or(
        `id.eq.${session.userId},clerk_user_id.eq.${session.userId}`
      )
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { amount } = await request.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get bank profile
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

    if (!bankProfile) {
      return NextResponse.json({ error: 'Bank profile not found. Please add your bank details first.' }, { status: 400 });
    }

    // Submit withdrawal using new service
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

    // 1. Email to partner confirming receipt
    smtpTransporter.sendMail({
      from: fromAddress,
      to: partner.email,
      subject: `Withdrawal Request Received — ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">Withdrawal Request Received</h2>
          <p>Hi ${partner.full_name},</p>
          <p>Your withdrawal request of <strong>₦${amount.toLocaleString()}</strong> has been received and is currently under review.</p>
          <p>You will be notified of the outcome within <strong>24–48 hours</strong>.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The AutoLearn Spot Team</p>
        </div>
      `,
    }).catch((err: unknown) => console.error('[Withdrawal Email] Failed to send partner email:', err));

    // 2. Email to founder with full bank details
    const founderEmail = process.env.FOUNDER_EMAIL || 'femiadeleke2020@gmail.com';
    smtpTransporter.sendMail({
      from: fromAddress,
      to: founderEmail,
      subject: `New Partner Withdrawal: ₦${amount.toLocaleString()} from ${partner.full_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">New Partner Withdrawal Request</h2>
          <p>A partner has submitted a withdrawal request.</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Withdrawal Details</h3>
            <p><strong>Full Name:</strong> ${partner.full_name}</p>
            <p><strong>Email:</strong> ${partner.email}</p>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Bank Name:</strong> ${bankProfile.bank_name}</p>
            <p><strong>Account Number:</strong> ${bankProfile.account_number}</p>
            <p><strong>Account Name:</strong> ${bankProfile.account_name}</p>
          </div>
          <p>Please review and process this withdrawal request.</p>
          <p>Best regards,<br>AutoLearn Spot System</p>
        </div>
      `,
    }).catch((err: unknown) => console.error('[Withdrawal Email] Failed to send founder email:', err));

    return NextResponse.json({ success: true, withdrawal: result.withdrawal });
  } catch (error) {
    console.error('[POST /api/partners/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Flat partner lookup
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('id')
      .or(`id.eq.${session.userId},clerk_user_id.eq.${session.userId}`)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { data: withdrawals } = await supabaseAdmin
      .from('partner_withdrawals')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ withdrawals: withdrawals || [] });
  } catch (error) {
    console.error('[GET /api/partners/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
