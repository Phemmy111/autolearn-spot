import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Settings categories
const SETTINGS_CATEGORIES = {
  brand: ['site_name', 'site_tagline', 'primary_color', 'secondary_color', 'accent_color', 'support_email', 'support_phone', 'support_whatsapp', 'whatsapp_direct_link', 'whatsapp_community_link', 'instagram_url', 'tiktok_url', 'youtube_url', 'facebook_url', 'twitter_url', 'linkedin_url'],
  footer: ['footer_description', 'footer_copyright_text', 'footer_privacy_link', 'footer_terms_link', 'footer_contact_link'],
  hero: ['hero_headline', 'hero_subheadline', 'hero_badge', 'hero_primary_cta_text', 'hero_primary_cta_link', 'hero_secondary_cta_text', 'hero_secondary_cta_link', 'hero_video_url', 'hero_image_url', 'hero_media_type'],
  liveClass: ['live_class_title', 'live_class_date', 'live_class_time', 'live_class_timezone', 'live_class_url', 'live_class_description', 'live_class_join_button_text', 'live_class_countdown_enabled', 'live_class_recording_url', 'live_class_replay_enabled', 'live_class_status'],
  enrollment: ['enrollment_open', 'enrollment_button_text', 'enrollment_announcement', 'enrollment_deadline', 'current_cohort_name', 'current_cohort_number', 'cohort_start_date', 'cohort_end_date', 'enrollment_page_headline', 'enrollment_page_description'],
  certificate: ['certificate_background_url', 'certificate_logo_url', 'certificate_title', 'certificate_subtitle', 'certificate_body_text', 'certificate_founder_name', 'certificate_signature_url', 'certificate_signature_text', 'certificate_qr_enabled', 'certificate_qr_destination', 'certificate_footer', 'certificate_accent_color', 'certificate_number_format'],
  seo: ['site_title', 'meta_description', 'og_title', 'og_description', 'og_image', 'twitter_card_type'],
  sections: ['section_hero_enabled', 'section_workflow_showcase_enabled', 'section_features_enabled', 'section_testimonials_enabled', 'section_pricing_enabled', 'section_scholarship_enabled', 'section_partnership_enabled', 'section_faq_enabled', 'section_cta_enabled', 'section_footer_enabled'],
  partner: ['partner_program_enabled', 'partner_program_headline', 'partner_program_description', 'partner_registration_open', 'partner_application_deadline', 'partner_whatsapp_link', 'partner_terms_link', 'partner_faq_link'],
  scholarship: ['scholarship_enabled', 'scholarship_title', 'scholarship_description', 'scholarship_eligibility', 'scholarship_application_deadline', 'scholarship_available_slots', 'scholarship_application_button_text', 'scholarship_announcement'],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category && SETTINGS_CATEGORIES[category as keyof typeof SETTINGS_CATEGORIES]) {
      // Get specific category
      const keys = SETTINGS_CATEGORIES[category as keyof typeof SETTINGS_CATEGORIES];
      const { data: settings, error } = await supabaseAdmin
        .from('site_settings')
        .select('key, value')
        .in('key', keys);

      if (error) throw error;

      const result: Record<string, string> = {};
      if (settings) {
        for (const setting of settings) {
          // Handle JSONB values - unwrap if stored as JSON string
          let value = setting.value;
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (typeof parsed === 'string') {
                value = parsed;
              }
            } catch {
              // Not JSON, keep as is
            }
          }
          result[setting.key] = value;
        }
      }

      return NextResponse.json({ success: true, settings: result });
    } else {
      // Get all settings
      const { data: settings, error } = await supabaseAdmin
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const result: Record<string, string> = {};
      if (settings) {
        for (const setting of settings) {
          // Handle JSONB values - unwrap if stored as JSON string
          let value = setting.value;
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (typeof parsed === 'string') {
                value = parsed;
              }
            } catch {
              // Not JSON, keep as is
            }
          }
          result[setting.key] = value;
        }
      }

      return NextResponse.json({ success: true, settings: result });
    }
  } catch (error) {
    console.error('[GET /api/admin/master-settings] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings object' }, { status: 400 });
    }

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: JSON.stringify(String(value)),
    }));

    const results = await Promise.all(
      updates.map(({ key, value }) =>
        supabaseAdmin
          .from('site_settings')
          .upsert({ key, value }, { onConflict: 'key' })
      )
    );

    for (const result of results) {
      if (result.error) {
        console.error('Error updating setting:', result.error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/admin/master-settings] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}