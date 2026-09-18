-- Migration: Live Classes System with Jitsi Integration
-- Phase D: Author Engagement Master

-- Create live_class_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_class_status') THEN
    CREATE TYPE live_class_status AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');
  END IF;
END$$;

-- Create live_classes table
CREATE TABLE IF NOT EXISTS public.live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_product_id UUID NOT NULL REFERENCES public.learning_products(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  meeting_provider TEXT NOT NULL DEFAULT 'JITSI',
  meeting_room TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  status live_class_status NOT NULL DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_classes_product ON public.live_classes(learning_product_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_author ON public.live_classes(author_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_status ON public.live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled_start ON public.live_classes(scheduled_start);

-- Add comments
COMMENT ON TABLE public.live_classes IS 'Live class sessions for learning products';
COMMENT ON COLUMN public.live_classes.meeting_provider IS 'Video conferencing provider: JITSI, ZOOM, etc.';
COMMENT ON COLUMN public.live_classes.meeting_room IS 'Unique room identifier for the meeting';
COMMENT ON COLUMN public.live_classes.meeting_url IS 'Full URL to join the meeting';

-- Enable Row Level Security
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Authors can manage their own live classes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'live_classes' 
    AND policyname = 'Authors can manage own live classes'
  ) THEN
    CREATE POLICY "Authors can manage own live classes"
      ON public.live_classes FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.authors 
          WHERE authors.id = live_classes.author_id 
          AND authors.clerk_user_id = auth.jwt() ->> 'sub'
        )
      );
  END IF;
END$$;

-- Students can view live classes for products they have access to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'live_classes' 
    AND policyname = 'Students can view accessible live classes'
  ) THEN
    CREATE POLICY "Students can view accessible live classes"
      ON public.live_classes FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.enrollments
          JOIN public.cohorts ON cohorts.id = enrollments.cohort_id
          WHERE cohorts.learning_product_id = live_classes.learning_product_id
          AND enrollments.clerk_user_id = auth.jwt() ->> 'sub'
          AND enrollments.status = 'active'
        )
      );
  END IF;
END$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_live_classes_updated_at ON public.live_classes;
CREATE TRIGGER trigger_update_live_classes_updated_at
  BEFORE UPDATE ON public.live_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_live_classes_updated_at();

-- Create function to generate unique Jitsi meeting URL
CREATE OR REPLACE FUNCTION generate_jitsi_meeting_url(product_title TEXT, unique_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Sanitize product title and create unique room name
  RETURN 'https://meet.jit.si/AutoLearn-' || 
         regexp_replace(product_title, '[^a-zA-Z0-9-]', '', 'g') || 
         '-' || unique_id;
END;
$$ LANGUAGE plpgsql;