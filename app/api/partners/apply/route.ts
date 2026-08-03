import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';
import { PartnerEmailService } from '@/lib/partner-system/PartnerEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const full_name = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const state = formData.get('state') as string;
    const occupation = formData.get('occupation') as string;
    const motivation = formData.get('motivation') as string;
    const promotion_method = formData.get('promotion_method') as string;
    
    // Optional fields
    const organization = formData.get('organization') as string | null;
    const website = formData.get('website') as string | null;
    const facebook = formData.get('facebook') as string | null;
    const instagram = formData.get('instagram') as string | null;
    const tiktok = formData.get('tiktok') as string | null;
    const linkedin = formData.get('linkedin') as string | null;
    const youtube = formData.get('youtube') as string | null;
    const experience = formData.get('experience') as string | null;
    const passport = formData.get('passport') as File | null;

    // Validation
    if (!full_name || !email || !phone || !whatsapp || !state || !occupation || !motivation || !promotion_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle passport upload if provided
    let passport_url = null;
    if (passport && passport.size > 0) {
      try {
        const fileExt = passport.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `partner-passports/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('partner-documents')
          .upload(filePath, passport);
        
        if (uploadError) {
          console.error('[POST /api/partners/apply] Upload error:', uploadError);
          // Continue without passport if upload fails
        } else {
          const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('partner-documents')
            .getPublicUrl(filePath);
          passport_url = publicUrl;
        }
      } catch (uploadError) {
        console.error('[POST /api/partners/apply] Upload exception:', uploadError);
        // Continue without passport if upload fails
      }
    }

    // Check if application already exists for this email
    const { data: existingApplication } = await supabaseAdmin
      .from('partner_applications')
      .select('id, status')
      .eq('email', email)
      .single();

    if (existingApplication) {
      if (existingApplication.status === 'pending' || existingApplication.status === 'under_review') {
        return NextResponse.json({ error: 'You already have a pending application' }, { status: 400 });
      }
      if (existingApplication.status === 'approved') {
        return NextResponse.json({ error: 'You are already a partner' }, { status: 400 });
      }
    }

    // Create application
    const { data: application, error } = await supabaseAdmin
      .from('partner_applications')
      .insert({
        full_name,
        email,
        phone,
        whatsapp,
        state,
        occupation,
        motivation,
        promotion_method,
        organization,
        website,
        facebook,
        instagram,
        tiktok,
        linkedin,
        youtube,
        experience,
        passport_url,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/partners/apply] Database error:', error);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    await logReferralEvent({
      action: 'partner_application_submitted',
      category: 'application',
      description: `Community partner application submitted by ${email}`,
      metadata: { 
        applicationId: application.id, 
        email,
        fullName: full_name 
      }
    });

    // Send application received email to applicant
    await PartnerEmailService.sendApplicationReceivedEmail(email, full_name);

    // Send notification to admin (you can configure admin email in env vars)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@autolearnspot.com';
    await PartnerEmailService.sendAdminNewApplicationNotification(adminEmail, full_name, email, application.id);

    return NextResponse.json({ 
      success: true, 
      application,
      message: 'Application submitted successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/partners/apply] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}