-- Master Admin Control Center Schema
-- Centralized settings and content management for AutoLearn Spot

-- ============================================
-- 1. GENERAL WEBSITE / BRAND SETTINGS
-- Extend site_settings with new keys for brand settings
-- ============================================

-- Brand Settings Keys
INSERT INTO site_settings (key, value) VALUES
  ('site_name', '"AutoLearn Spot"'::jsonb),
  ('site_tagline', '"Master AI agents and build autonomous systems that work for you"'::jsonb),
  ('primary_color', '"#00f0ff"'::jsonb),
  ('secondary_color', '"#8b5cf6"'::jsonb),
  ('accent_color', '"#00f0ff"'::jsonb),
  ('support_email', '"support@autolearnspot.com"'::jsonb),
  ('support_phone', '"+234"'::jsonb),
  ('support_whatsapp', '"+234"'::jsonb),
  ('whatsapp_direct_link', '"https://wa.me/"'::jsonb),
  ('whatsapp_community_link', '"https://chat.whatsapp.com/"'::jsonb),
  ('instagram_url', '"https://instagram.com/"'::jsonb),
  ('tiktok_url', '"https://tiktok.com/"'::jsonb),
  ('youtube_url', '"https://youtube.com/"'::jsonb),
  ('facebook_url', '"https://facebook.com/"'::jsonb),
  ('twitter_url', '"https://twitter.com/"'::jsonb),
  ('linkedin_url', '"https://linkedin.com/"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 2. FOOTER SETTINGS
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('footer_description', '"Master AI agents and build autonomous systems that work for you."'::jsonb),
  ('footer_copyright_text', '"AutoLearn Spot"'::jsonb),
  ('footer_privacy_link', '"/privacy"'::jsonb),
  ('footer_terms_link', '"/terms"'::jsonb),
  ('footer_contact_link', '"/contact"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 3. LANDING PAGE HERO SETTINGS
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('hero_headline', '"BUILD REAL AI AUTOMATIONS. GET CERTIFIED."'::jsonb),
  ('hero_subheadline', '"Master n8n automation and build powerful AI-powered workflows without coding."'::jsonb),
  ('hero_badge', '"4 WEEK HANDS-ON TRAINING"'::jsonb),
  ('hero_primary_cta_text', '"Enroll Now"'::jsonb),
  ('hero_primary_cta_link', '"/enroll"'::jsonb),
  ('hero_secondary_cta_text', '"Watch Preview"'::jsonb),
  ('hero_secondary_cta_link', '"#"'::jsonb),
  ('hero_video_url', '""'::jsonb),
  ('hero_image_url', '""'::jsonb),
  ('hero_media_type', '"workflow_panel"'::jsonb) -- 'workflow_panel', 'video', 'image'
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 4. WORKFLOW SHOWCASE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_showcase (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  poster_url TEXT,
  featured BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 5. TESTIMONIALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT,
  cohort TEXT,
  course TEXT,
  screenshot_url TEXT NOT NULL,
  caption TEXT,
  featured BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 6. CERTIFICATE SETTINGS
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('certificate_background_url', '"/certificate-template.jpg"'::jsonb),
  ('certificate_logo_url', '""'::jsonb),
  ('certificate_title', '"Certificate of Completion"'::jsonb),
  ('certificate_subtitle', '"This certifies that"'::jsonb),
  ('certificate_body_text', '"has successfully completed the"'::jsonb),
  ('certificate_founder_name', '"AutoLearn Spot"'::jsonb),
  ('certificate_signature_url', '""'::jsonb),
  ('certificate_signature_text', '"Founder"'::jsonb),
  ('certificate_qr_enabled', '"true"'::jsonb),
  ('certificate_qr_destination', '"https://autolearn-spot.vercel.app/certificate/verify"'::jsonb),
  ('certificate_footer', '"AutoLearn Spot - AI Automation Training"'::jsonb),
  ('certificate_accent_color', '"#00f0ff"'::jsonb),
  ('certificate_number_format', '"ALS-{year}-{cohort}-{sequence}"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 7. ANNOUNCEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT true,
  display_position TEXT DEFAULT 'top', -- 'top', 'bottom', 'hero'
  display_type TEXT DEFAULT 'banner', -- 'banner', 'modal', 'strip'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 8. LIVE CLASS SETTINGS
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('live_class_title', '"Live n8n Workshop"'::jsonb),
  ('live_class_date', '""'::jsonb),
  ('live_class_time', '"20:00"'::jsonb),
  ('live_class_timezone', '"WAT"'::jsonb),
  ('live_class_url', '""'::jsonb),
  ('live_class_description', '"Join our live workshop to learn n8n automation"'::jsonb),
  ('live_class_join_button_text', '"Join Class"'::jsonb),
  ('live_class_countdown_enabled', '"true"'::jsonb),
  ('live_class_recording_url', '""'::jsonb),
  ('live_class_replay_enabled', '"false"'::jsonb),
  ('live_class_status', '"scheduled"'::jsonb) -- 'scheduled', 'live', 'ended', 'cancelled'
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 9. ENROLLMENT / COHORT SETTINGS
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('enrollment_open', '"true"'::jsonb),
  ('enrollment_button_text', '"Enroll Now"'::jsonb),
  ('enrollment_announcement', '"Registration is now open for the next cohort!"'::jsonb),
  ('enrollment_deadline', '""'::jsonb),
  ('current_cohort_name', '"Cohort 2"'::jsonb),
  ('current_cohort_number', '"2"'::jsonb),
  ('cohort_start_date', '""'::jsonb),
  ('cohort_end_date', '""'::jsonb),
  ('enrollment_page_headline', '"Join Our Next AI Automation Cohort"'::jsonb),
  ('enrollment_page_description', '"Master n8n automation in 4 weeks with hands-on projects"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 10. PARTNER PROGRAM SETTINGS
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('partner_program_enabled', '"true"'::jsonb),
  ('partner_program_headline', '"Become a Partner"'::jsonb),
  ('partner_program_description', '"Earn commissions by referring students to our AI automation training"'::jsonb),
  ('partner_registration_open', '"true"'::jsonb),
  ('partner_application_deadline', '""'::jsonb),
  ('partner_whatsapp_link', '"https://chat.whatsapp.com/"'::jsonb),
  ('partner_terms_link', '"/partners/terms"'::jsonb),
  ('partner_faq_link', '"/partners/faq"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 11. SCHOLARSHIP EXTENDED SETTINGS
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('scholarship_enabled', '"true"'::jsonb),
  ('scholarship_title', '"Scholarship Program"'::jsonb),
  ('scholarship_description', '"Get discounted access to our AI automation training"'::jsonb),
  ('scholarship_eligibility', '"Open to students and early career professionals"'::jsonb),
  ('scholarship_application_deadline', '""'::jsonb),
  ('scholarship_available_slots', '"50"'::jsonb),
  ('scholarship_application_button_text', '"Apply for Scholarship"'::jsonb),
  ('scholarship_announcement', '"Limited scholarships available!"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 12. SEO / METADATA SETTINGS
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('site_title', '"AutoLearn Spot - AI Automation Training"'::jsonb),
  ('meta_description', '"Master n8n automation and build powerful AI-powered workflows without coding. Join our hands-on training program."'::jsonb),
  ('og_title', '"AutoLearn Spot - AI Automation Training"'::jsonb),
  ('og_description', '"Master n8n automation and build powerful AI-powered workflows without coding."'::jsonb),
  ('og_image', '"/og-image.jpg"'::jsonb),
  ('twitter_card_type', '"summary_large_image"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 13. LANDING PAGE SECTION VISIBILITY
-- ============================================

INSERT INTO site_settings (key, value) VALUES
  ('section_hero_enabled', '"true"'::jsonb),
  ('section_workflow_showcase_enabled', '"true"'::jsonb),
  ('section_features_enabled', '"true"'::jsonb),
  ('section_testimonials_enabled', '"true"'::jsonb),
  ('section_pricing_enabled', '"true"'::jsonb),
  ('section_scholarship_enabled', '"true"'::jsonb),
  ('section_partnership_enabled', '"true"'::jsonb),
  ('section_faq_enabled', '"true"'::jsonb),
  ('section_cta_enabled', '"true"'::jsonb),
  ('section_footer_enabled', '"true"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 14. MEDIA STORAGE BUCKET
-- ============================================

-- Create storage bucket for admin media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-media',
  'admin-media',
  true, -- Public bucket for media assets
  10485760, -- 10 MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read admin-media" ON storage.objects;

-- Create policy for admin upload/management
CREATE POLICY "Admins can manage admin-media"
ON storage.objects FOR ALL
USING (
  bucket_id = 'admin-media'
  AND (
    -- Allow admins (role check via RLS)
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    -- Or allow service role
    OR auth.role() = 'service_role'
  )
);

-- Create policy for public read
CREATE POLICY "Public can read admin-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-media');

-- ============================================
-- 15. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workflow_showcase_order ON workflow_showcase(display_order);
CREATE INDEX IF NOT EXISTS idx_workflow_showcase_enabled ON workflow_showcase(enabled);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials(display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_enabled ON testimonials(enabled);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_enabled ON announcements(enabled);

-- ============================================
-- 16. RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE workflow_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage workflow_showcase" ON workflow_showcase
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage testimonials" ON testimonials
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Public read policies for enabled items
CREATE POLICY "Public can read enabled workflow_showcase" ON workflow_showcase
  FOR SELECT USING (enabled = true);

CREATE POLICY "Public can read enabled testimonials" ON testimonials
  FOR SELECT USING (enabled = true);

CREATE POLICY "Public can read active announcements" ON announcements
  FOR SELECT USING (
    enabled = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- ============================================
-- 17. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_showcase_updated_at BEFORE UPDATE ON workflow_showcase
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();