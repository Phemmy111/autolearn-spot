import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';
import { PartnerApplicationService } from '@/lib/partner-system/PartnerApplicationService';

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

    // Check if application or partner already exists for this email
    const cleanEmail = email.toLowerCase().trim();
    const { data: existingPartner } = await supabaseAdmin
      .from('partners')
      .select('id, status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingPartner) {
      if (existingPartner.status === 'pending') {
        return NextResponse.json({ error: 'You already have a pending application under review.' }, { status: 400 });
      }
      if (existingPartner.status === 'active') {
        return NextResponse.json({ error: 'You are already an active partner. Please sign in at /partners/login.' }, { status: 400 });
      }
    }

    // Generate ALS Partner ID
    const prefix = 'ALS';
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const newPartnerId = `${prefix}${suffix}`;

    // Create partner application in partners table
    const { data: application, error } = await supabaseAdmin
      .from('partners')
      .insert({
        partner_id: newPartnerId,
        name: full_name,
        email: cleanEmail,
        phone: phone || whatsapp,
        status: 'pending',
        total_clicks: 0,
        total_registrations: 0,
        available_earnings: 0,
        total_earnings: 0
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/partners/apply] Database error:', error);
      return NextResponse.json({ error: 'Failed to submit application', details: error.message }, { status: 500 });
    }

    console.log('[POST /api/partners/apply] Application created successfully in partners table:', application.id);

    // Persist complete application dossier with all submitted form fields
    await PartnerApplicationService.saveApplication({
      id: application.id,
      partner_id: newPartnerId,
      full_name,
      name: full_name,
      email: cleanEmail,
      phone: phone || '',
      whatsapp: whatsapp || '',
      state: state || '',
      occupation: occupation || '',
      organization: organization || '',
      website: website || '',
      motivation: motivation || '',
      promotion_method: promotion_method || '',
      experience: experience || '',
      facebook: facebook || '',
      instagram: instagram || '',
      tiktok: tiktok || '',
      linkedin: linkedin || '',
      youtube: youtube || '',
      passport_url: passport_url || '',
      status: 'pending',
      applied_at: new Date().toISOString()
    });

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
        applicantPhone: phone || whatsapp,
        whatsapp,
        state,
        occupation,
        organization: organization || undefined,
        partnerType: 'community',
        motivation,
        promotionMethod: promotion_method,
        experience: experience || undefined,
        website: website || undefined,
        partnerId: newPartnerId,
        socialLinks: {
          facebook: facebook || undefined,
          instagram: instagram || undefined,
          tiktok: tiktok || undefined,
          linkedin: linkedin || undefined,
          youtube: youtube || undefined,
        }
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
