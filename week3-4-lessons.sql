-- Insert Week 3 and Week 4 videos into the lessons table
-- This associates the new videos with the default cohort so progress tracking works.

INSERT INTO lessons (id, cohort_id, title, description, vimeo_video_id, week, duration, available_at)
VALUES 
  ('wk3-vid1', 'a1111111-1111-1111-1111-111111111111', 'Session 7: Week 3 Monday', 'Week 3 Session 1', '1212926093', 3, '23 mins', '2026-07-27T00:00:00Z'),
  ('wk3-vid2', 'a1111111-1111-1111-1111-111111111111', 'Session 8: Week 3 Wednesday', 'Week 3 Session 2', '1212944798', 3, '1hr 2mins', '2026-07-29T00:00:00Z'),
  ('wk3-vid3', 'a1111111-1111-1111-1111-111111111111', 'Session 9: Week 3 Friday', 'Week 3 Session 3', '1213005975', 3, 'TBD', '2026-07-31T00:00:00Z'),
  ('wk4-vid1', 'a1111111-1111-1111-1111-111111111111', 'Session 10: Week 4 Monday', 'Week 4 Session 1', '1212965316', 4, '25 mins', '2026-08-03T00:00:00Z'),
  ('wk4-vid2', 'a1111111-1111-1111-1111-111111111111', 'Session 11: Week 4 Wednesday', 'Week 4 Session 2', '1212966091', 4, '13 mins', '2026-08-05T00:00:00Z'),
  ('wk4-vid3', 'a1111111-1111-1111-1111-111111111111', 'Session 12: Week 4 Friday', 'Week 4 Session 3', '1212966090', 4, '2 mins', '2026-08-07T00:00:00Z')
ON CONFLICT (id, cohort_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  vimeo_video_id = EXCLUDED.vimeo_video_id,
  week = EXCLUDED.week,
  duration = EXCLUDED.duration,
  available_at = EXCLUDED.available_at;
