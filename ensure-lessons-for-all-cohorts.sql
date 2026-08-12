-- Ensure lessons exist for all cohorts
-- This script copies lessons from Cohort 1 to any cohort that doesn't have lessons yet
-- Run this after creating a new cohort to auto-populate it with the standard curriculum

DO $$
DECLARE
  cohort_record RECORD;
  lesson_count INTEGER;
BEGIN
  -- Loop through all cohorts
  FOR cohort_record IN 
    SELECT id, name FROM cohorts WHERE is_current = false OR id != 'a1111111-1111-1111-1111-111111111111'
  LOOP
    -- Check if this cohort has any lessons
    SELECT COUNT(*) INTO lesson_count 
    FROM lessons 
    WHERE cohort_id = cohort_record.id;
    
    -- If no lessons exist, copy from Cohort 1
    IF lesson_count = 0 THEN
      RAISE NOTICE 'Copying lessons to cohort: % (%)', cohort_record.name, cohort_record.id;
      
      INSERT INTO lessons (
        id, cohort_id, title, description, vdo_cipher_video_id, vimeo_video_id,
        available_at, duration_label, week_number, session_number, release_day, order_index
      )
      SELECT 
        id, 
        cohort_record.id as cohort_id,
        title, 
        description, 
        vdo_cipher_video_id, 
        vimeo_video_id,
        available_at,  -- Copy the same schedule initially
        duration_label, 
        week_number, 
        session_number, 
        release_day, 
        order_index
      FROM lessons
      WHERE cohort_id = 'a1111111-1111-1111-1111-111111111111';
      
      RAISE NOTICE 'Successfully copied lessons to cohort: %', cohort_record.name;
    ELSE
      RAISE NOTICE 'Cohort % (%) already has % lessons', cohort_record.name, cohort_record.id, lesson_count;
    END IF;
  END LOOP;
END $$;

-- Verify the operation
SELECT 
  c.id as cohort_id,
  c.name as cohort_name,
  COUNT(l.id) as lesson_count
FROM cohorts c
LEFT JOIN lessons l ON c.id = l.cohort_id
GROUP BY c.id, c.name
ORDER BY c.created_at DESC;
