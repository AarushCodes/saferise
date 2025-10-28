-- Allow authenticated users to view basic info from other users
-- This is needed for the job marketplace to show who posted jobs

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new policies: users can view their own full profile, and can view basic info from others
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view basic info from other users" ON users
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND id IN (
      SELECT posted_by FROM jobs
    )
  );
