import { supabaseAdmin } from '@/lib/supabase';

// ============================================
// BRAND SETTINGS
// ============================================

const BRAND_SETTING_KEYS = {
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
};

const BRAND_DEFAULTS = {
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
};

export interface BrandSettings {
  siteName: string;
  siteTagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsApp: string;
  whatsappDirectLink: string;
  whatsappCommunityLink: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
}

// ============================================
// FOOTER SETTINGS
// ============================================

const FOOTER_SETTING_KEYS = {
  description: 'footer_description',
  copyrightText: 'footer_copyright_text',
  privacyLink: 'footer_privacy_link',
  termsLink: 'footer_terms_link',
  contactLink: 'footer_contact_link',
};

const FOOTER_DEFAULTS = {
  description: 'Master AI agents and build autonomous systems that work for you.',
  copyrightText: 'AutoLearn Spot',
  privacyLink: '/privacy',
  termsLink: '/terms',
  contactLink: '/contact',
};

export interface FooterSettings {
  description: string;
  copyrightText: string;
  privacyLink: string;
  termsLink: string;
  contactLink: string;
}

// ============================================
// HERO SETTINGS
// ============================================

const HERO_SETTING_KEYS = {
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
};

const HERO_DEFAULTS = {
  headline: 'BUILD REAL AI AUTOMATIONS. GET CERTIFIED.',
  subheadline: 'Master n8n automation and build powerful AI-powered workflows without coding.',
  badge: '4 WEEK HANDS-ON TRAINING',
  primaryCtaText: 'Enroll Now',
  primaryCtaLink: '/enroll',
  secondaryCtaText: 'Watch Preview',
  secondaryCtaLink: '#',
  videoUrl: '',
  imageUrl: '',
  mediaType: 'workflow_panel',
};

export interface HeroSettings {
  headline: string;
  subheadline: string;
  badge: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  videoUrl: string;
  imageUrl: string;
  mediaType: 'workflow_panel' | 'video' | 'image';
}

// ============================================
// LIVE CLASS SETTINGS
// ============================================

const LIVE_CLASS_SETTING_KEYS = {
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
};

const LIVE_CLASS_DEFAULTS = {
  title: 'Live n8n Workshop',
  date: '',
  time: '20:00',
  timezone: 'WAT',
  url: '',
  description: 'Join our live workshop to learn n8n automation',
  joinButtonText: 'Join Class',
  countdownEnabled: 'true',
  recordingUrl: '',
  replayEnabled: 'false',
  status: 'scheduled',
};

export interface LiveClassSettings {
  title: string;
  date: string;
  time: string;
  timezone: string;
  url: string;
  description: string;
  joinButtonText: string;
  countdownEnabled: boolean;
  recordingUrl: string;
  replayEnabled: boolean;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
}

// ============================================
// ENROLLMENT SETTINGS
// ============================================

const ENROLLMENT_SETTING_KEYS = {
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
};

const ENROLLMENT_DEFAULTS = {
  open: 'true',
  buttonText: 'Enroll Now',
  announcement: 'Registration is now open for the next cohort!',
  deadline: '',
  currentCohortName: 'Cohort 2',
  currentCohortNumber: '2',
  cohortStartDate: '',
  cohortEndDate: '',
  pageHeadline: 'Join Our Next AI Automation Cohort',
  pageDescription: 'Master n8n automation in 4 weeks with hands-on projects',
};

export interface EnrollmentSettings {
  open: boolean;
  buttonText: string;
  announcement: string;
  deadline: string;
  currentCohortName: string;
  currentCohortNumber: string;
  cohortStartDate: string;
  cohortEndDate: string;
  pageHeadline: string;
  pageDescription: string;
}

// ============================================
// CERTIFICATE SETTINGS
// ============================================

const CERTIFICATE_SETTING_KEYS = {
  backgroundUrl: 'certificate_background_url',
  logoUrl: 'certificate_logo_url',
  title: 'certificate_title',
  subtitle: 'certificate_subtitle',
  bodyText: 'certificate_body_text',
  founderName: 'certificate_founder_name',
  signatureUrl: 'certificate_signature_url',
  signatureText: 'certificate_signature_text',
  qrEnabled: 'certificate_qr_enabled',
  qrDestination: 'certificate_qr_destination',
  footer: 'certificate_footer',
  accentColor: 'certificate_accent_color',
  numberFormat: 'certificate_number_format',
};

const CERTIFICATE_DEFAULTS = {
  backgroundUrl: '/certificate-template.jpg',
  logoUrl: '',
  title: 'Certificate of Completion',
  subtitle: 'This certifies that',
  bodyText: 'has successfully completed the',
  founderName: 'AutoLearn Spot',
  signatureUrl: '',
  signatureText: 'Founder',
  qrEnabled: 'true',
  qrDestination: 'https://autolearn-spot.vercel.app/certificate/verify',
  footer: 'AutoLearn Spot - AI Automation Training',
  accentColor: '#00f0ff',
  numberFormat: 'ALS-{year}-{cohort}-{sequence}',
};

export interface CertificateSettings {
  backgroundUrl: string;
  logoUrl: string;
  title: string;
  subtitle: string;
  bodyText: string;
  founderName: string;
  signatureUrl: string;
  signatureText: string;
  qrEnabled: boolean;
  qrDestination: string;
  footer: string;
  accentColor: string;
  numberFormat: string;
}

// ============================================
// SEO SETTINGS
// ============================================

const SEO_SETTING_KEYS = {
  siteTitle: 'site_title',
  metaDescription: 'meta_description',
  ogTitle: 'og_title',
  ogDescription: 'og_description',
  ogImage: 'og_image',
  twitterCardType: 'twitter_card_type',
};

const SEO_DEFAULTS = {
  siteTitle: 'AutoLearn Spot - AI Automation Training',
  metaDescription: 'Master n8n automation and build powerful AI-powered workflows without coding. Join our hands-on training program.',
  ogTitle: 'AutoLearn Spot - AI Automation Training',
  ogDescription: 'Master n8n automation and build powerful AI-powered workflows without coding.',
  ogImage: '/og-image.jpg',
  twitterCardType: 'summary_large_image',
};

export interface SeoSettings {
  siteTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCardType: string;
}

// ============================================
// SECTION VISIBILITY SETTINGS
// ============================================

const SECTION_KEYS = {
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
};

const SECTION_DEFAULTS = {
  hero: 'true',
  workflowShowcase: 'true',
  features: 'true',
  testimonials: 'true',
  pricing: 'true',
  scholarship: 'true',
  partnership: 'true',
  faq: 'true',
  cta: 'true',
  footer: 'true',
};

export interface SectionVisibility {
  hero: boolean;
  workflowShowcase: boolean;
  features: boolean;
  testimonials: boolean;
  pricing: boolean;
  scholarship: boolean;
  partnership: boolean;
  faq: boolean;
  cta: boolean;
  footer: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getSettings(keys: Record<string, string>, defaults: any): Promise<any> {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(keys));

    if (error) {
      console.error('Error fetching settings:', error);
      return defaults;
    }

    const values = { ...defaults };

    if (settings) {
      for (const setting of settings) {
        const key = Object.keys(keys).find(k => keys[k] === setting.key);
        if (key) {
          // Handle JSONB values - if value is a string in JSONB format, parse it
          let value = setting.value;
          if (typeof value === 'string') {
            // Try to parse as JSON
            try {
              const parsed = JSON.parse(value);
              // If it's a string (wrapped in quotes), unwrap it
              if (typeof parsed === 'string') {
                value = parsed;
              } else {
                value = value; // Keep original if not a simple string
              }
            } catch {
              // Not JSON, keep as is
              value = value;
            }
          }
          values[key] = value || defaults[key];
        }
      }
    }

    return values;
  } catch (e) {
    console.error('Error fetching settings:', e);
    return defaults;
  }
}

async function updateSettings(updates: Record<string, { key: string; value: string }[]>): Promise<boolean> {
  try {
    const operations = Object.values(updates).flat();
    
    const results = await Promise.all(
      operations.map(({ key, value }) =>
        supabaseAdmin
          .from('site_settings')
          .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' })
      )
    );

    for (const result of results) {
      if (result.error) {
        console.error('Error updating setting:', result.error);
        return false;
      }
    }

    return true;
  } catch (e) {
    console.error('Error updating settings:', e);
    return false;
  }
}

// ============================================
// EXPORTED FUNCTIONS
// ============================================

export async function getBrandSettings(): Promise<BrandSettings> {
  const settings = await getSettings(BRAND_SETTING_KEYS, BRAND_DEFAULTS);
  return settings as BrandSettings;
}

export async function getFooterSettings(): Promise<FooterSettings> {
  const settings = await getSettings(FOOTER_SETTING_KEYS, FOOTER_DEFAULTS);
  return settings as FooterSettings;
}

export async function getHeroSettings(): Promise<HeroSettings> {
  const settings = await getSettings(HERO_SETTING_KEYS, HERO_DEFAULTS);
  return {
    ...settings,
    mediaType: settings.mediaType as 'workflow_panel' | 'video' | 'image',
  } as HeroSettings;
}

export async function getLiveClassSettings(): Promise<LiveClassSettings> {
  const settings = await getSettings(LIVE_CLASS_SETTING_KEYS, LIVE_CLASS_DEFAULTS);
  return {
    ...settings,
    countdownEnabled: settings.countdownEnabled === 'true',
    replayEnabled: settings.replayEnabled === 'true',
    status: settings.status as 'scheduled' | 'live' | 'ended' | 'cancelled',
  } as LiveClassSettings;
}

export async function getEnrollmentSettings(): Promise<EnrollmentSettings> {
  const settings = await getSettings(ENROLLMENT_SETTING_KEYS, ENROLLMENT_DEFAULTS);
  return {
    ...settings,
    open: settings.open === 'true',
  } as EnrollmentSettings;
}

export async function getCertificateSettings(): Promise<CertificateSettings> {
  const settings = await getSettings(CERTIFICATE_SETTING_KEYS, CERTIFICATE_DEFAULTS);
  return {
    ...settings,
    qrEnabled: settings.qrEnabled === 'true',
  } as CertificateSettings;
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const settings = await getSettings(SEO_SETTING_KEYS, SEO_DEFAULTS);
  return settings as SeoSettings;
}

export async function getSectionVisibility(): Promise<SectionVisibility> {
  const settings = await getSettings(SECTION_KEYS, SECTION_DEFAULTS);
  const result: any = {};
  for (const key of Object.keys(SECTION_KEYS)) {
    result[key] = settings[key] === 'true';
  }
  return result as SectionVisibility;
}

export async function updateBrandSettings(settings: Partial<BrandSettings>): Promise<boolean> {
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      updates.push({ key: BRAND_SETTING_KEYS[key as keyof BrandSettings], value: String(value) });
    }
  }
  return updateSettings({ brand: updates });
}

export async function updateFooterSettings(settings: Partial<FooterSettings>): Promise<boolean> {
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      updates.push({ key: FOOTER_SETTING_KEYS[key as keyof FooterSettings], value: String(value) });
    }
  }
  return updateSettings({ footer: updates });
}

export async function updateHeroSettings(settings: Partial<HeroSettings>): Promise<boolean> {
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      updates.push({ key: HERO_SETTING_KEYS[key as keyof HeroSettings], value: String(value) });
    }
  }
  return updateSettings({ hero: updates });
}

export async function updateLiveClassSettings(settings: Partial<LiveClassSettings>): Promise<boolean> {
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      updates.push({ key: LIVE_CLASS_SETTING_KEYS[key as keyof LiveClassSettings], value: String(value) });
    }
  }
  return updateSettings({ liveClass: updates });
}

export async function updateEnrollmentSettings(settings: Partial<EnrollmentSettings>): Promise<boolean> {
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      updates.push({ key: ENROLLMENT_SETTING_KEYS[key as keyof EnrollmentSettings], value: String(value) });
    }
  }
  return updateSettings({ enrollment: updates });
}

export async function updateCertificateSettings(settings: Partial<CertificateSettings>): Promise<boolean> {
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      updates.push({ key: CERTIFICATE_SETTING_KEYS[key as keyof CertificateSettings], value: String(value) });
    }
  }
  return updateSettings({ certificate: updates });
}

export async function updateSeoSettings(settings: Partial<SeoSettings>): Promise<boolean> {
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      updates.push({ key: SEO_SETTING_KEYS[key as keyof SeoSettings], value: String(value) });
    }
  }
  return updateSettings({ seo: updates });
}

export async function updateSectionVisibility(settings: Partial<SectionVisibility>): Promise<boolean> {
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      updates.push({ key: SECTION_KEYS[key as keyof SectionVisibility], value: String(value) });
    }
  }
  return updateSettings({ sections: updates });
}