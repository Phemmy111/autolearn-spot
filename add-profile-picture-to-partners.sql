-- Add profile_picture column to influencers table
ALTER TABLE influencers 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add profile_picture column to community_ambassadors table
ALTER TABLE community_ambassadors 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;
