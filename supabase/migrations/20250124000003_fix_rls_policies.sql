-- Fix RLS policies to allow users to create their own profiles

-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies for users table
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Drop existing policies for worker_profiles table
DROP POLICY IF EXISTS "Workers can view own profile" ON worker_profiles;
DROP POLICY IF EXISTS "Workers can update own profile" ON worker_profiles;

-- Create new policies for worker_profiles table
CREATE POLICY "Workers can view own profile"
ON worker_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Workers can insert own profile"
ON worker_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers can update own profile"
ON worker_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow managers to view worker profiles
CREATE POLICY "Managers can view worker profiles"
ON worker_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
  )
);
