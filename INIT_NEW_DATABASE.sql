-- ============================================================================
-- AUTOLEARN SPOT - COMPLETE DATABASE INITIALIZATION SCRIPT
-- Run this in your new Supabase project's SQL Editor (https://supabase.com/dashboard/project/tjvgonysradvjybwjhsn/sql/new)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CATEGORIES & SKILLS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. LEARNING PRODUCTS
CREATE TABLE IF NOT EXISTS public.learning_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    author_id TEXT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    thumbnail TEXT,
    thumbnail_url TEXT,
    product_type TEXT NOT NULL DEFAULT 'COURSE',
    price DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
    currency TEXT NOT NULL DEFAULT 'NGN',
    access_duration_days INTEGER DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    affiliate_enabled BOOLEAN DEFAULT true,
    affiliate_commission_rate INTEGER DEFAULT 20,
    cohort_id UUID,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. COHORTS
CREATE TABLE IF NOT EXISTS public.cohorts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  price_ngn INTEGER DEFAULT 5000,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Lagos',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LESSONS
CREATE TABLE IF NOT EXISTS public.lessons (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  uuid_id UUID DEFAULT uuid_generate_v4() UNIQUE,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.learning_products(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  vdo_cipher_video_id VARCHAR(255),
  vimeo_video_id VARCHAR(255),
  youtube_url TEXT,
  youtube_video_id VARCHAR(255),
  youtube_thumbnail TEXT,
  available_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_label VARCHAR(50),
  week_number INTEGER NOT NULL DEFAULT 0,
  session_number INTEGER NOT NULL DEFAULT 0,
  release_day VARCHAR(20) NOT NULL DEFAULT 'monday',
  resources JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
  is_required BOOLEAN NOT NULL DEFAULT true,
  unlock_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  clerk_user_id VARCHAR(255),
  payment_ref VARCHAR(255),
  amount_paid INTEGER,
  payment_amount INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  referral_code VARCHAR(100),
  referred_by_code VARCHAR(100),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  cohort VARCHAR(255),
  profile_picture TEXT,
  notes TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  invited_at TIMESTAMP WITH TIME ZONE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. LESSON PROGRESS
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  lesson_id VARCHAR(100),
  lesson_uuid_id UUID REFERENCES public.lessons(uuid_id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  watch_pct INTEGER NOT NULL DEFAULT 0 CHECK (watch_pct >= 0 AND watch_pct <= 100),
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (lesson_uuid_id, user_id)
);

-- 8. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  order_ref TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'NGN',
  subtotal NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','PAID','FAILED','CANCELLED')),
  payment_provider TEXT NOT NULL DEFAULT 'paystack',
  provider_ref TEXT,
  customer_name TEXT,
  customer_email TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE RESTRICT,
  product_title TEXT NOT NULL,
  price_snapshot NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. CARTS & CART ITEMS
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  learning_product_id UUID NOT NULL REFERENCES public.learning_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cart_id, learning_product_id)
);

-- 10. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE SET NULL,
  course_title VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  certificate_code VARCHAR(100) NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_user_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. AUTHORS & SALES
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.author_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.learning_products(id) ON DELETE SET NULL,
  author_id VARCHAR(255),
  gross_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.author_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  related_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.author_bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(50) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  recipient_code VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.author_withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  reference VARCHAR(255),
  transfer_code VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. PARTNERS & AFFILIATES
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id TEXT UNIQUE,
  user_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  total_clicks INTEGER DEFAULT 0,
  total_registrations INTEGER DEFAULT 0,
  available_earnings NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  owner_id VARCHAR(255),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE CASCADE,
  unique_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(50) DEFAULT 'normal',
  target_type VARCHAR(50) DEFAULT 'student',
  target_id VARCHAR(255),
  action_url TEXT,
  action_label VARCHAR(100),
  event_id VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. LIVE CLASSES & MESSAGES
CREATE TABLE IF NOT EXISTS public.live_classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  meeting_url TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(50) DEFAULT 'UPCOMING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.author_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.author_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.author_conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SEED ESSENTIAL DATA
-- ============================================================================

-- 1. Insert Category & Skill
INSERT INTO public.categories (id, name, slug, description, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Automation', 'automation', 'Workflows and automated AI systems', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.skills (id, category_id, name, slug, description, status)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'n8n Automation', 'n8n-automation', 'Learn n8n automation and AI workflows', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert The Core Course: "AI Automation with n8n"
INSERT INTO public.learning_products (
  id,
  skill_id,
  author_id,
  title,
  slug,
  description,
  thumbnail_url,
  price,
  currency,
  access_duration_days,
  status,
  affiliate_enabled,
  affiliate_commission_rate
) VALUES (
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '00000000-0000-0000-0000-000000000002',
  'author_admin',
  'AI Automation with n8n',
  'ai-automation-with-n8n',
  '{"short_description":"Master automated AI workflows, connect APIs, and deploy production pipelines using n8n.","full_description":"Comprehensive hands-on course covering n8n automation from beginner to production grade. Learn how to integrate LLMs, databases, webhooks, and third-party APIs to build powerful autonomous workflows.","learning_outcomes":["Build production-ready n8n workflows from scratch","Integrate OpenAI, Claude, and local AI models into automated pipelines","Connect databases (PostgreSQL, Supabase) and external REST APIs","Handle errors, rate limits, and secure secret credentials","Deploy and scale self-hosted n8n instances on modern cloud providers"],"media_gallery":["/n8n-mockup.png","/workflow-real.jpg","/videos/workflow.mp4"]}',
  '/n8n-mockup.png',
  5000.00,
  'NGN',
  60,
  'PUBLISHED',
  true,
  20
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  thumbnail_url = EXCLUDED.thumbnail_url,
  description = EXCLUDED.description,
  status = 'PUBLISHED';

-- 2b. Insert Author Record
INSERT INTO public.authors (
  user_id,
  name,
  email,
  bio,
  avatar_url,
  status
) VALUES (
  'author_admin',
  'Femi Adeleke',
  'femi@autolearnspot.com',
  'Specialist in scalable n8n workflows, enterprise API integrations, and AI agent architectures.',
  '/femi-headshot.png',
  'active'
) ON CONFLICT (user_id) DO NOTHING;

-- 3. Insert Cohort 2 (for backward compatibility)
INSERT INTO public.cohorts (
  id,
  name,
  slug,
  price_ngn,
  status,
  is_current,
  learning_product_id
) VALUES (
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'Cohort 2',
  'cohort-2',
  5000,
  'active',
  true,
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921'
) ON CONFLICT (slug) DO UPDATE SET
  learning_product_id = 'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921';

-- 4. Insert The 12 Course Lessons with YouTube IDs
INSERT INTO public.lessons (
  id,
  uuid_id,
  product_id,
  cohort_id,
  title,
  description,
  youtube_video_id,
  duration_label,
  order_index,
  status,
  is_required
) VALUES
(
  'lesson-1789585442333-2979p3yf3',
  'a117a7cc-19e7-4097-997d-bab438bfd117',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'Theory + Setup (AI & Automation intro, ChatGPT + n8n account setup)',
  'Introduction to n8n, how to set up your account, and core concepts of nodes, triggers, and credentials.',
  'VXL590SV1Gw',
  '30 mins',
  0,
  'PUBLISHED',
  true
),
(
  'lesson-1789265236746-3i0s88t0o',
  '66f8dddc-b607-4979-a071-f66d8d1bba5c',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'Email Automation',
  'Build your first automation: trigger a workflow from a webhook/form and send an email automatically.',
  '5gmC5976Lf8',
  '30 mins',
  1,
  'PUBLISHED',
  true
),
(
  'lesson-1789599388814-g4wyg85xw',
  'b53e905e-9557-4969-af62-390fe1b3acb6',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'Adding Google Sheets to Your Automation',
  'Learn how to read from and write to Google Sheets to store your automation data permanently.',
  '1WO-oVGZKZk',
  '35 mins',
  2,
  'PUBLISHED',
  true
),
(
  'lesson-1789599710798-jw918gtid',
  'c9800f43-055c-46f9-b21a-3d4201244fc4',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'AI Telegram Bot',
  'Build an AI-powered conversational bot on Telegram using n8n and OpenAI.',
  'TnoTbtJApZ0',
  '45 mins',
  3,
  'PUBLISHED',
  true
),
(
  'lesson-1789599788030-z12efg5ux',
  '399c0e8e-8bbd-41c0-93a3-e77f23adeada',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'AI Email Auto-Responder',
  'Learn how to automatically read incoming emails, generate a response using AI, and send it back.',
  'RoJxAfYfoUw',
  '40 mins',
  4,
  'PUBLISHED',
  true
),
(
  'lesson-1789599847582-j1032sbbk',
  '587679cb-f73d-48ab-98c2-f761c6ffd2b0',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'AI Content Summarizer',
  'Learn how to scrape website content and use AI to generate concise summaries.',
  'gfIgz05XpgM',
  '35 mins',
  5,
  'PUBLISHED',
  true
),
(
  'lesson-1789599930849-n89f5pz5w',
  'fa6b48db-62fe-4dee-a856-e56ac7328068',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'Deploy n8n on Railway',
  'Self-host and deploy your own production-grade n8n instance on Railway cloud.',
  'ojHX4n-Dv9I',
  '23 mins',
  6,
  'PUBLISHED',
  true
),
(
  'lesson-1789600012260-b10t0u812',
  '9e0f0317-2b94-4dd4-af20-87d95a33a352',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'AI Customer Support Agent',
  'Construct an autonomous AI support agent that looks up knowledge and handles customer tickets.',
  'gNKFHCLN_F4',
  '1hr 2mins',
  7,
  'PUBLISHED',
  true
),
(
  'lesson-1789600223886-ejx3c50ak',
  '4e4f164f-da09-415b-a141-ab667c269907',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'Lead Capture + AI Qualifier',
  'Capture inbound leads, qualify them with AI evaluation, and route them to your CRM.',
  'Z_Zo41yNfZU',
  '45 mins',
  8,
  'PUBLISHED',
  true
),
(
  'lesson-1789600370673-g1coeikvj',
  'a766b88f-d630-4b06-bc6f-91d76bcb77f2',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'AI Social Media Content Bot',
  'Build an automated engine that writes, schedules, and generates images for social media posts.',
  'PsbjAA48rlk',
  '25 mins',
  9,
  'PUBLISHED',
  true
),
(
  'lesson-1789600512915-g612ney1q',
  '8496d2b6-4eb3-4624-81ef-b53deaad4f2c',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'Add Quality Control',
  'Implement error-handling, fallback nodes, and quality checks in your automation pipelines.',
  'WlPVxMrcAV4',
  '13 mins',
  10,
  'PUBLISHED',
  true
),
(
  'lesson-1789600612842-yt21me696',
  '51128fbc-bce5-48a0-baa9-b163fabdf849',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'Polish, Portfolio packaging + certificate',
  'Packaging your client automation projects, showcasing your work, and getting your verified certificate.',
  'deMcOpk-2qM',
  '15 mins',
  11,
  'PUBLISHED',
  true
)
ON CONFLICT (id) DO UPDATE SET
  uuid_id = EXCLUDED.uuid_id,
  product_id = EXCLUDED.product_id,
  title = EXCLUDED.title,
  youtube_video_id = EXCLUDED.youtube_video_id,
  duration_label = EXCLUDED.duration_label,
  order_index = EXCLUDED.order_index,
  status = 'PUBLISHED';

-- 5. Insert Active Enrollments
INSERT INTO public.enrollments (
  email,
  full_name,
  first_name,
  last_name,
  clerk_user_id,
  cohort_id,
  learning_product_id,
  status,
  amount_paid,
  payment_ref
) VALUES 
(
  'allentyemmanueladedokun@gmail.com',
  'Emmanuel Adedokun',
  'Emmanuel',
  'Adedokun',
  NULL,
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  'active',
  5000,
  'MANUAL-1792140373880'
),
(
  'femiadeleke2020@gmail.com',
  'Segun Adeleke',
  'Segun',
  'Adeleke',
  'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  'active',
  5000,
  'T738071403000904'
),
(
  'femiadeleke200@gmail.com',
  'Femi Adeleke',
  'Femi',
  'Adeleke',
  'user_3JI4lwWSCQXqH9LKg30kcabvJmV',
  '3633e893-7bc4-4cb6-9617-f7c5255aeaa9',
  'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
  'active',
  5000,
  'MANUAL-ADMIN'
);

-- 6. Insert Default Site Settings
INSERT INTO public.site_settings (key, value) VALUES
('platform_commission_rate', '10'),
('certificateTitle', 'Certificate of Completion'),
('certificateSubtitle', 'This is proudly presented to'),
('certificateCourse', 'AI Automation with n8n'),
('certificateFounderName', 'AutoLearn Spot'),
('certificateSignatureText', 'Founder & Lead Instructor'),
('certificateQrEnabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Disable Row Level Security on core application tables so Clerk and service_role can interact seamlessly
ALTER TABLE public.learning_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_bank_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_messages DISABLE ROW LEVEL SECURITY;
