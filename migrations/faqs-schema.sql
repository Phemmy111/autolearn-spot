-- FAQ Management Schema
-- Convert hardcoded FAQs to database-backed system

-- ============================================
-- 1. CREATE FAQ TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 2. SEED EXISTING FAQ CONTENT
-- ============================================

-- Extracted from components/FAQSection.tsx
INSERT INTO faqs (question, answer, display_order) VALUES
  ('Do I need coding experience?', 'No. AutoLearn Spot is 100% beginner-friendly. n8n is visual — no coding required.', 0),
  ('What if I miss a session?', 'All sessions are recorded and available for lifetime access.', 1),
  ('Is the certificate recognized?', 'Yes. The certificate is issued by Moon Space Network.', 2)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_enabled ON faqs(enabled);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage faqs" ON faqs
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Public read policy for enabled FAQs
CREATE POLICY "Public can read enabled faqs" ON faqs
  FOR SELECT USING (enabled = true);

-- ============================================
-- 5. UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
