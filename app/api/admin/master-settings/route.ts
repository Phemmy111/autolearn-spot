import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Settings categories with database keys
const SETTINGS_CATEGORIES = {
  brand: ['site_name', 'site_tagline', 'primary_color', 'secondary_color', 'accent_color', 'support_email', 'support_phone', 'support_whatsapp', 'whatsapp_direct_link', 'whatsapp_community_link', 'instagram_url', 'tiktok_url', 'youtube_url', 'facebook_url', 'twitter_url', 'linkedin_url'],
  footer: ['footer_description', 'footer_copyright_text', 'footer_privacy_link', 'footer_terms_link', 'footer_contact_link'],
  hero: ['hero_headline', 'hero_subheadline', 'hero_badge', 'hero_primary_cta_text', 'hero_primary_cta_link', 'hero_secondary_cta_text', 'hero_secondary_cta_link', 'hero_video_url', 'hero_image_url', 'hero_media_type'],
  liveClass: ['live_class_title', 'live_class_date', 'live_class_time', 'live_class_timezone', 'live_class_url', 'live_class_description', 'live_class_join_button_text', 'live_class_countdown_enabled', 'live_class_recording_url', 'live_class_replay_enabled', 'live_class_status'],
  enrollment: ['enrollment_open', 'enrollment_button_text', 'enrollment_announcement', 'enrollment_deadline', 'current_cohort_name', 'current_cohort_number', 'cohort_start_date', 'cohort_end_date', 'enrollment_page_headline', 'enrollment_page_description'],
  certificate: ['certificate_background_url', 'certificate_logo_url', 'certificate_title', 'certificate_subtitle', 'certificate_body_text', 'certificate_course', 'certificate_founder_name', 'certificate_signature_url', 'certificate_signature_text', 'certificate_qr_enabled', 'certificate_qr_destination', 'certificate_footer', 'certificate_accent_color', 'certificate_number_format'],
  seo: ['site_title', 'meta_description', 'og_title', 'og_description', 'og_image', 'twitter_card_type'],
  sections: ['section_hero_enabled', 'section_workflow_showcase_enabled', 'section_features_enabled', 'section_testimonials_enabled', 'section_pricing_enabled', 'section_scholarship_enabled', 'section_partnership_enabled', 'section_faq_enabled', 'section_cta_enabled', 'section_footer_enabled'],
  partner: ['partner_program_enabled', 'partner_program_headline', 'partner_program_description', 'partner_registration_open', 'partner_application_deadline', 'partner_whatsapp_link', 'partner_terms_link', 'partner_faq_link'],
  scholarship: ['scholarship_enabled', 'scholarship_title', 'scholarship_description', 'scholarship_eligibility', 'scholarship_application_deadline', 'scholarship_available_slots', 'scholarship_application_button_text', 'scholarship_announcement'],
};

// Key mapping: frontend camelCase -> database snake_case
const KEY_MAPPING: Record<string, string> = {
  // Brand
  siteName: 'site_name',
  siteTagline: 'site_tagline',
  primaryColor: 'primary_color',
  secondaryColor: 'secondary_color',
  accentColor: 'accent_color',
  supportEmail: 'support_email',
  supportPhone: 'support_phone',
  supportWhatsApp: 'support_whatsapp',
  whatsappDirectLink: 'whatsapp_direct_link',
  whatsappCommunityLink: 'whatsapp_community_link',
  instagramUrl: 'instagram_url',
  tiktokUrl: 'tiktok_url',
  youtubeUrl: 'youtube_url',
  facebookUrl: 'facebook_url',
  twitterUrl: 'twitter_url',
  linkedinUrl: 'linkedin_url',
  // Footer
  description: 'footer_description',
  copyrightText: 'footer_copyright_text',
  privacyLink: 'footer_privacy_link',
  termsLink: 'footer_terms_link',
  contactLink: 'footer_contact_link',
  // Hero
  headline: 'hero_headline',
  subheadline: 'hero_subheadline',
  badge: 'hero_badge',
  primaryCtaText: 'hero_primary_cta_text',
  primaryCtaLink: 'hero_primary_cta_link',
  secondaryCtaText: 'hero_secondary_cta_text',
  secondaryCtaLink: 'hero_secondary_cta_link',
  videoUrl: 'hero_video_url',
  imageUrl: 'hero_image_url',
  mediaType: 'hero_media_type',
  // Live Class
  title: 'live_class_title',
  date: 'live_class_date',
  time: 'live_class_time',
  timezone: 'live_class_timezone',
  url: 'live_class_url',
  description: 'live_class_description',
  joinButtonText: 'live_class_join_button_text',
  countdownEnabled: 'live_class_countdown_enabled',
  recordingUrl: 'live_class_recording_url',
  replayEnabled: 'live_class_replay_enabled',
  status: 'live_class_status',
  // Enrollment
  open: 'enrollment_open',
  buttonText: 'enrollment_button_text',
  announcement: 'enrollment_announcement',
  deadline: 'enrollment_deadline',
  currentCohortName: 'current_cohort_name',
  currentCohortNumber: 'current_cohort_number',
  cohortStartDate: 'cohort_start_date',
  cohortEndDate: 'cohort_end_date',
  pageHeadline: 'enrollment_page_headline',
  pageDescription: 'enrollment_page_description',
  // Certificate
  backgroundUrl: 'certificate_background_url',
  logoUrl: 'certificate_logo_url',
  title: 'certificate_title',
  subtitle: 'certificate_subtitle',
  bodyText: 'certificate_body_text',
  course: 'certificate_course',
  founderName: 'certificate_founder_name',
  signatureUrl: 'certificate_signature_url',
  signatureText: 'certificate_signature_text',
  qrEnabled: 'certificate_qr_enabled',
  qrDestination: 'certificate_qr_destination',
  footer: 'certificate_footer',
  accentColor: 'certificate_accent_color',
  numberFormat: 'certificate_number_format',
  // SEO
  siteTitle: 'site_title',
  metaDescription: 'meta_description',
  ogTitle: 'og_title',
  ogDescription: 'og_description',
  ogImage: 'og_image',
  twitterCardType: 'twitter_card_type',
  // Sections
  hero: 'section_hero_enabled',
  workflowShowcase: 'section_workflow_showcase_enabled',
  features: 'section_features_enabled',
  testimonials: 'section_testimonials_enabled',
  pricing: 'section_pricing_enabled',
  scholarship: 'section_scholarship_enabled',
  partnership: 'section_partnership_enabled',
  faq: 'section_faq_enabled',
  cta: 'section_cta_enabled',
  footer: 'section_footer_enabled',
  // Partner
  programEnabled: 'partner_program_enabled',
  programHeadline: 'partner_program_headline',
  programDescription: 'partner_program_description',
  registrationOpen: 'partner_registration_open',
  applicationDeadline: 'partner_application_deadline',
  whatsappLink: 'partner_whatsapp_link',
  termsLink: 'partner_terms_link',
  faqLink: 'partner_faq_link',
  // Scholarship
  title: 'scholarship_title',
  applicationButton: 'scholarship_application_button_text',
  availableSlots: 'scholarship_available_slots',
};

// Reverse mapping: database snake_case -> frontend camelCase
const REVERSE_KEY_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAPPING).map(([k, v]) => [v, k])
);

function convertToDatabaseKeys(settings: Record<string, any>): Record<string, string> {
  const converted: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    const dbKey = KEY_MAPPING[key] || key;
    converted[dbKey] = String(value);
  }
  return converted;
}

function convertToFrontendKeys(settings: Record<string, string>): Record<string, string> {
  const converted: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    const frontendKey = REVERSE_KEY_MAPPING[key] || key;
    converted[frontendKey] = value;
  }
  return converted;
}

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

      // Convert database keys to frontend keys
      const frontendSettings = convertToFrontendKeys(result);

      return NextResponse.json({ success: true, settings: frontendSettings });
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

      // Convert database keys to frontend keys
      const frontendSettings = convertToFrontendKeys(result);

      return NextResponse.json({ success: true, settings: frontendSettings });
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

    // Convert frontend camelCase keys to database snake_case keys
    const dbSettings = convertToDatabaseKeys(settings);

    const updates = Object.entries(dbSettings).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
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