import { supabaseAdmin } from '@/lib/supabase';
import { unstable_noStore as noStore } from 'next/cache';

interface PublicSettings {
  // Brand
  siteName?: string;
  siteTagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
  whatsappDirectLink?: string;
  whatsappCommunityLink?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;

  // Footer
  footerDescription?: string;
  footerCopyrightText?: string;
  footerPrivacyLink?: string;
  footerTermsLink?: string;
  footerContactLink?: string;

  // Hero
  heroHeadline?: string;
  heroSubheadline?: string;
  heroBadge?: string;
  heroPrimaryCtaText?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaText?: string;
  heroSecondaryCtaLink?: string;
  heroVideoUrl?: string;
  heroImageUrl?: string;
  heroMediaType?: string;

  // Live Class
  liveClassTitle?: string;
  liveClassDate?: string;
  liveClassTime?: string;
  liveClassTimezone?: string;
  liveClassUrl?: string;
  liveClassDescription?: string;
  liveClassJoinButtonText?: string;
  liveClassCountdownEnabled?: string;
  liveClassRecordingUrl?: string;
  liveClassReplayEnabled?: string;
  liveClassStatus?: string;

  // Enrollment
  enrollmentOpen?: string;
  enrollmentButtonText?: string;
  enrollmentAnnouncement?: string;
  enrollmentDeadline?: string;
  currentCohortName?: string;
  currentCohortNumber?: string;
  cohortStartDate?: string;
  cohortEndDate?: string;
  enrollmentPageHeadline?: string;
  enrollmentPageDescription?: string;

  // Certificate
  certificateBackgroundUrl?: string;
  certificateLogoUrl?: string;
  certificateTitle?: string;
  certificateSubtitle?: string;
  certificateBodyText?: string;
  certificateCourse?: string;
  certificateFounderName?: string;
  certificateSignatureUrl?: string;
  certificateSignatureText?: string;
  certificateQrEnabled?: string;
  certificateQrDestination?: string;
  certificateFooter?: string;
  certificateAccentColor?: string;
  certificateNumberFormat?: string;
  certificateLayout?: string;

  // SEO
  siteTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCardType?: string;

  // Sections
  sectionHeroEnabled?: string;
  sectionWorkflowShowcaseEnabled?: string;
  sectionFeaturesEnabled?: string;
  sectionTestimonialsEnabled?: string;
  sectionPricingEnabled?: string;
  sectionScholarshipEnabled?: string;
  sectionPartnershipEnabled?: string;
  sectionFaqEnabled?: string;
  sectionCtaEnabled?: string;
  sectionFooterEnabled?: string;

  // Partner
  partnerProgramEnabled?: string;
  partnerProgramHeadline?: string;
  partnerProgramDescription?: string;
  partnerRegistrationOpen?: string;
  partnerApplicationDeadline?: string;
  partnerWhatsappLink?: string;
  partnerTermsLink?: string;
  partnerFaqLink?: string;

  // Scholarship
  scholarshipEnabled?: string;
  scholarshipTitle?: string;
  scholarshipDescription?: string;
  scholarshipEligibility?: string;
  scholarshipApplicationDeadline?: string;
  scholarshipAvailableSlots?: string;
  scholarshipApplicationButtonText?: string;
  scholarshipAnnouncement?: string;
}

const DEFAULT_SETTINGS: PublicSettings = {
  // Brand
  siteName: 'AutoLearn Spot',
  siteTagline: 'Master AI agents and build autonomous systems that work for you',
  primaryColor: '#00f0ff',
  secondaryColor: '#8b5cf6',
  accentColor: '#00f0ff',
  supportEmail: 'support@autolearnspot.com',
  supportPhone: '+234',
  supportWhatsApp: '+234',
  whatsappDirectLink: 'https://wa.me/',
  whatsappCommunityLink: 'https://chat.whatsapp.com/',
  instagramUrl: 'https://instagram.com/',
  tiktokUrl: 'https://tiktok.com/',
  youtubeUrl: 'https://youtube.com/',
  facebookUrl: 'https://facebook.com/',
  twitterUrl: 'https://twitter.com/',
  linkedinUrl: 'https://linkedin.com/',

  // Footer
  footerDescription: 'Master AI agents and build autonomous systems that work for you.',
  footerCopyrightText: 'AutoLearn Spot',
  footerPrivacyLink: '/privacy',
  footerTermsLink: '/terms',
  footerContactLink: '/contact',

  // Hero
  heroHeadline: 'BUILD REAL AI AUTOMATIONS. GET CERTIFIED.',
  heroSubheadline: 'Master n8n automation and build powerful AI-powered workflows without coding.',
  heroBadge: '4 WEEK HANDS-ON TRAINING',
  heroPrimaryCtaText: 'Enroll Now',
  heroPrimaryCtaLink: '/enroll',
  heroSecondaryCtaText: 'Watch Preview',
  heroSecondaryCtaLink: '#',

  // SEO
  siteTitle: 'AutoLearn Spot - n8n & AI Automation Training',
  metaDescription: 'A 4-week hands-on n8n automation training where every session ends with a working, deployable workflow.',
  ogTitle: 'AutoLearn Spot - n8n & AI Automation Training',
  ogDescription: 'A 4-week hands-on n8n automation training where every session ends with a working, deployable workflow.',
  ogImage: '/og-image.png',
  twitterCardType: 'summary_large_image',
};

// Key mapping: database snake_case -> frontend camelCase
const KEY_MAPPING: Record<string, keyof PublicSettings> = {
  // Brand
  site_name: 'siteName',
  site_tagline: 'siteTagline',
  primary_color: 'primaryColor',
  secondary_color: 'secondaryColor',
  accent_color: 'accentColor',
  support_email: 'supportEmail',
  support_phone: 'supportPhone',
  support_whatsapp: 'supportWhatsApp',
  whatsapp_direct_link: 'whatsappDirectLink',
  whatsapp_community_link: 'whatsappCommunityLink',
  instagram_url: 'instagramUrl',
  tiktok_url: 'tiktokUrl',
  youtube_url: 'youtubeUrl',
  facebook_url: 'facebookUrl',
  twitter_url: 'twitterUrl',
  linkedin_url: 'linkedinUrl',
  // Footer
  footer_description: 'footerDescription',
  footer_copyright_text: 'footerCopyrightText',
  footer_privacy_link: 'footerPrivacyLink',
  footer_terms_link: 'footerTermsLink',
  footer_contact_link: 'footerContactLink',
  // Hero
  hero_headline: 'heroHeadline',
  hero_subheadline: 'heroSubheadline',
  hero_badge: 'heroBadge',
  hero_primary_cta_text: 'heroPrimaryCtaText',
  hero_primary_cta_link: 'heroPrimaryCtaLink',
  hero_secondary_cta_text: 'heroSecondaryCtaText',
  hero_secondary_cta_link: 'heroSecondaryCtaLink',
  hero_video_url: 'heroVideoUrl',
  hero_image_url: 'heroImageUrl',
  hero_media_type: 'heroMediaType',
  // Live Class
  live_class_title: 'liveClassTitle',
  live_class_date: 'liveClassDate',
  live_class_time: 'liveClassTime',
  live_class_timezone: 'liveClassTimezone',
  live_class_url: 'liveClassUrl',
  live_class_description: 'liveClassDescription',
  live_class_join_button_text: 'liveClassJoinButtonText',
  live_class_countdown_enabled: 'liveClassCountdownEnabled',
  live_class_recording_url: 'liveClassRecordingUrl',
  live_class_replay_enabled: 'liveClassReplayEnabled',
  live_class_status: 'liveClassStatus',
  // Enrollment
  enrollment_open: 'enrollmentOpen',
  enrollment_button_text: 'enrollmentButtonText',
  enrollment_announcement: 'enrollmentAnnouncement',
  enrollment_deadline: 'enrollmentDeadline',
  current_cohort_name: 'currentCohortName',
  current_cohort_number: 'currentCohortNumber',
  cohort_start_date: 'cohortStartDate',
  cohort_end_date: 'cohortEndDate',
  enrollment_page_headline: 'enrollmentPageHeadline',
  enrollment_page_description: 'enrollmentPageDescription',
  // Certificate
  certificate_background_url: 'certificateBackgroundUrl',
  certificate_logo_url: 'certificateLogoUrl',
  certificate_title: 'certificateTitle',
  certificate_subtitle: 'certificateSubtitle',
  certificate_body_text: 'certificateBodyText',
  certificate_course: 'certificateCourse',
  certificate_founder_name: 'certificateFounderName',
  certificate_signature_url: 'certificateSignatureUrl',
  certificate_signature_text: 'certificateSignatureText',
  certificate_qr_enabled: 'certificateQrEnabled',
  certificate_qr_destination: 'certificateQrDestination',
  certificate_footer: 'certificateFooter',
  certificate_accent_color: 'certificateAccentColor',
  certificate_number_format: 'certificateNumberFormat',
  certificate_layout: 'certificateLayout',
  // SEO
  site_title: 'siteTitle',
  meta_description: 'metaDescription',
  og_title: 'ogTitle',
  og_description: 'ogDescription',
  og_image: 'ogImage',
  twitter_card_type: 'twitterCardType',
  // Sections
  section_hero_enabled: 'sectionHeroEnabled',
  section_workflow_showcase_enabled: 'sectionWorkflowShowcaseEnabled',
  section_features_enabled: 'sectionFeaturesEnabled',
  section_testimonials_enabled: 'sectionTestimonialsEnabled',
  section_pricing_enabled: 'sectionPricingEnabled',
  section_scholarship_enabled: 'sectionScholarshipEnabled',
  section_partnership_enabled: 'sectionPartnershipEnabled',
  section_faq_enabled: 'sectionFaqEnabled',
  section_cta_enabled: 'sectionCtaEnabled',
  section_footer_enabled: 'sectionFooterEnabled',
  // Partner
  partner_program_enabled: 'partnerProgramEnabled',
  partner_program_headline: 'partnerProgramHeadline',
  partner_program_description: 'partnerProgramDescription',
  partner_registration_open: 'partnerRegistrationOpen',
  partner_application_deadline: 'partnerApplicationDeadline',
  partner_whatsapp_link: 'partnerWhatsappLink',
  partner_terms_link: 'partnerTermsLink',
  partner_faq_link: 'partnerFaqLink',
  // Scholarship
  scholarship_enabled: 'scholarshipEnabled',
  scholarship_title: 'scholarshipTitle',
  scholarship_description: 'scholarshipDescription',
  scholarship_eligibility: 'scholarshipEligibility',
  scholarship_application_deadline: 'scholarshipApplicationDeadline',
  scholarship_available_slots: 'scholarshipAvailableSlots',
  scholarship_application_button_text: 'scholarshipApplicationButtonText',
  scholarship_announcement: 'scholarshipAnnouncement',
};

// Reverse mapping: frontend camelCase -> database snake_case
const REVERSE_KEY_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAPPING).map(([k, v]) => [v, k])
);

export async function getPublicSettings(keys?: string[]): Promise<PublicSettings> {
  noStore();
  
  try {
    let query = supabaseAdmin.from('site_settings').select('key, value');

    if (keys && keys.length > 0) {
      // Convert frontend camelCase keys to database snake_case keys
      const dbKeys = keys.map(key => REVERSE_KEY_MAPPING[key] || key);
      query = query.in('key', dbKeys);
    }

    const { data: settings, error } = await query;

    if (error) {
      console.error('[getPublicSettings] Error:', error);
      return DEFAULT_SETTINGS;
    }

    const result: PublicSettings = { ...DEFAULT_SETTINGS };

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

        const frontendKey = KEY_MAPPING[setting.key];
        if (frontendKey) {
          result[frontendKey] = value as any;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[getPublicSettings] Exception:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function getPublicSetting(key: string): Promise<string | undefined> {
  const settings = await getPublicSettings([key]);
  return settings[key as keyof PublicSettings];
}