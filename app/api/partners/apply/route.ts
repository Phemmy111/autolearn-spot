import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';
import { PartnerEmailService } from '@/lib/partner-system/PartnerEmailService';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    console.log('[POST /api/partners/apply] Received form data entries:', Array.from(formData.entries()));
    
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

    console.log('[POST /api/partners/apply] Parsed fields:', {
      full_name: !!full_name,
      email: !!email,
      phone: !!phone,
      whatsapp: !!whatsapp,
      state: !!state,
      occupation: !!occupation,
      motivation: !!motivation,
      promotion_method: !!promotion_method,
      hasPassport: !!passport
    });

    // Validation
    if (!full_name || !email || !phone || !whatsapp || !state || !occupation || !motivation || !promotion_method) {
      console.error('[POST /api/partners/apply] Missing required fields:', { 
        full_name: !!full_name, 
        email: !!email, 
        phone: !!phone, 
        whatsapp: !!whatsapp, 
        state: !!state, 
        occupation: !!occupation, 
        motivation: !!motivation, 
        promotion_method: !!promotion_method 
      });
      return NextResponse.json({ 
        error: 'Missing required fields. Please fill in all required fields.',
        missing: {
          full_name: !full_name,
          email: !email,
          phone: !phone,
          whatsapp: !whatsapp,
          state: !state,
          occupation: !occupation,
          motivation: !motivation,
          promotion_method: !promotion_method
        }
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[POST /api/partners/apply] Invalid email:', email);
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Handle passport upload if provided - temporarily disabled due to schema issues
    let passport_url = null;
    /*
    if (passport && passport.size > 0) {
      try {
        console.log('[POST /api/partners/apply] Attempting passport upload:', passport.name, passport.size);
        
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
          console.log('[POST /api/partners/apply] Passport uploaded successfully:', passport_url);
        }
      } catch (uploadError) {
        console.error('[POST /api/partners/apply] Upload exception:', uploadError);
        // Continue without passport if upload fails
      }
    }
    */

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
    console.log('[POST /api/partners/apply] Creating application with data:', {
      full_name,
      email,
      phone,
      whatsapp,
      state,
      occupation,
      motivation,
      promotion_method,
      has_organization: !!organization,
      has_website: !!website
    });

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
        // passport_url - temporarily removed due to schema issues
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/partners/apply] Database error:', error);
      return NextResponse.json({ error: 'Failed to submit application', details: error.message }, { status: 500 });
    }

    console.log('[POST /api/partners/apply] Application created successfully:', application.id);

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
    try {
      await PartnerEmailService.sendApplicationReceivedEmail(email, full_name);
      console.log('[POST /api/partners/apply] Application email sent successfully');
    } catch (emailError) {
      console.error('[POST /api/partners/apply] Email error:', emailError);
      // Continue even if email fails
    }

    // Send notification to admin about new application
    try {
      await AdminEmailService.sendPartnerApplicationEmail({
        applicantName: full_name,
        applicantEmail: email,
        applicantPhone: phone,
        partnerType: 'community',
        motivation: motivation
      });
      console.log('[POST /api/partners/apply] Admin notification sent successfully');
    } catch (adminEmailError) {
      console.error('[POST /api/partners/apply] Admin email error:', adminEmailError);
      // Continue even if admin email fails
    }

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