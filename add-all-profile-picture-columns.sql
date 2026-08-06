-- Add profile_picture column to enrollments table (students)
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add profile_picture column to influencers table (influencers)
ALTER TABLE influencers 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add profile_picture column to community_ambassadors table (community partners)
ALTER TABLE community_ambassadors 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Verify columns were added
SELECT 
  'enrollments' as table_name,
  column_name,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'enrollments' AND column_name = 'profile_picture'
UNION ALL
SELECT 
  'influencers' as table_name,
  column_name,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'influencers' AND column_name = 'profile_picture'
UNION ALL
SELECT 
  'community_ambassadors' as table_name,
  column_name,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'community_ambassadors' AND column_name = 'profile_picture';
