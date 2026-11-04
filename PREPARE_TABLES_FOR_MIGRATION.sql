-- ============================================================================
-- AutoLearn Spot: Ensure Complete Schema for Data Migration
-- Run this in the SQL Editor of your NEW Supabase project (tjvgonysradvjybwjhsn)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  week_number INTEGER NOT NULL DEFAULT 1,
  phase VARCHAR(50) NOT NULL DEFAULT 'WEEK_1',
  time_limit INTEGER,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice',
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quiz Responses
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  time_taken INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Leaderboard
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  total_score INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE,
  lesson_id VARCHAR(100),
  week_number INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  submission_type VARCHAR(50) NOT NULL DEFAULT 'url',
  rubric TEXT,
  ai_review_prompt TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  due_date TIMESTAMP WITH TIME ZONE,
  max_score INTEGER DEFAULT 100,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  screenshot_url TEXT,
  live_url TEXT,
  notes TEXT,
  ai_feedback TEXT,
  ai_score INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (assignment_id, user_id)
);

-- 7. Partner Marketing Downloads
CREATE TABLE IF NOT EXISTS public.partner_marketing_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  resource_name TEXT,
  resource_type TEXT DEFAULT 'flyer',
  name TEXT,
  type TEXT DEFAULT 'flyer',
  category TEXT DEFAULT 'general',
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Partner Bank Profiles
CREATE TABLE IF NOT EXISTS public.partner_bank_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'savings',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Partner Referrals
CREATE TABLE IF NOT EXISTS public.partner_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'clicked',
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Commissions
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.partner_referrals(id) ON DELETE SET NULL,
  learning_product_id UUID REFERENCES public.learning_products(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  holding_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
