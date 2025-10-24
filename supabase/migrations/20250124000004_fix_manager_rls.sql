-- Fix RLS policies for manager_profiles to allow users to create their own profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can view own profile" ON manager_profiles;
DROP POLICY IF EXISTS "Managers can update own profile" ON manager_profiles;

-- Create new policies for manager_profiles
CREATE POLICY "Managers can view own profile"
ON manager_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Managers can insert own profile"
ON manager_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update own profile"
ON manager_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
