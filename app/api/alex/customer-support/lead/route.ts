import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, message, pageUrl } = body;

    if (!fullName || !email || !message) {
      return NextResponse.json({ 
        error: 'Full name, email address, and a message are required.' 
      }, { status: 400 });
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const leadData = {
      id: leadId,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phoneNumber?.trim() || '',
      message: message.trim(),
      page_url: pageUrl || '',
      created_at: new Date().toISOString(),
      status: 'new'
    };

    // 1. Save individual lead in site_settings
    try {
      await supabaseAdmin.from('site_settings').insert({
        key: `customer_lead_${leadId}`,
        value: JSON.stringify(leadData)
      });

      // Update registry
      const { data: existingReg } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'customer_leads_registry')
        .maybeSingle();

      let registry: string[] = [];
      if (existingReg?.value) {
        try {
          registry = JSON.parse(existingReg.value);
        } catch {
          registry = [];
        }
      }
      registry.unshift(`customer_lead_${leadId}`);
      if (registry.length > 100) registry = registry.slice(0, 100);

      if (existingReg) {
        await supabaseAdmin
          .from('site_settings')
          .update({ value: JSON.stringify(registry), updated_at: new Date().toISOString() })
          .eq('key', 'customer_leads_registry');
      } else {
        await supabaseAdmin
          .from('site_settings')
          .insert({ key: 'customer_leads_registry', value: JSON.stringify(registry) });
      }
    } catch (dbErr) {
      console.error('[POST /api/alex/customer-support/lead] DB persistence error:', dbErr);
    }

    // 2. Dispatch email notification to founder & admin
    try {
      await AdminEmailService.sendCustomerInquiryEmail({
        fullName: leadData.full_name,
        email: leadData.email,
        phoneNumber: leadData.phone,
        message: leadData.message,
        pageUrl: leadData.page_url
      });
      console.log('[POST /api/alex/customer-support/lead] Notification email dispatched successfully');
    } catch (emailErr) {
      console.error('[POST /api/alex/customer-support/lead] Email dispatch error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been received. Founder Femi Adeleke and our admissions team will contact you shortly!'
    }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/alex/customer-support/lead] Error:', error);
    return NextResponse.json({ error: 'Failed to process inquiry' }, { status: 500 });
  }
}
