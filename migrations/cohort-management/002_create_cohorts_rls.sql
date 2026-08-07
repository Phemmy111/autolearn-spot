-- Sprint 1 Phase 1: Create RLS policies for cohorts table
-- Admins have full CRUD access
-- Students have read-only access to active cohorts

-- Enable RLS on cohorts table
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can view all cohorts" ON cohorts;
DROP POLICY IF EXISTS "Admins can create cohorts" ON cohorts;
DROP POLICY IF EXISTS "Admins can update cohorts" ON cohorts;
DROP POLICY IF EXISTS "Admins can delete cohorts" ON cohorts;
DROP POLICY IF EXISTS "Students can view active cohorts" ON cohorts;
DROP POLICY IF EXISTS "No direct access to cohorts" ON cohorts;

-- Admin policies - Full CRUD access
CREATE POLICY "Admins can view all cohorts"
ON cohorts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create cohorts"
ON cohorts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update cohorts"
ON cohorts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete cohorts"
ON cohorts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  )
);

-- Student policies - Read-only access to active cohorts
CREATE POLICY "Students can view active cohorts"
ON cohorts
FOR SELECT
TO authenticated
USING (
  status = 'active' OR is_active = true
);

-- Deny all other access
CREATE POLICY "No direct access to cohorts"
ON cohorts
FOR ALL
TO public
USING (false);
