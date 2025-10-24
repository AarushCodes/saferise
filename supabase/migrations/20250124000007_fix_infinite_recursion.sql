-- Fix infinite recursion by removing the problematic policy and using a better approach

-- First, drop all the policies that cause recursion
DROP POLICY IF EXISTS "Managers can view all user profiles" ON users;
DROP POLICY IF EXISTS "Managers can view all worker profiles" ON worker_profiles;
DROP POLICY IF EXISTS "Managers can view all check-ins" ON daily_check_ins;
DROP POLICY IF EXISTS "Managers can view all incidents" ON incidents;
DROP POLICY IF EXISTS "Managers can view all alerts" ON safety_alerts;
DROP POLICY IF EXISTS "Managers can view all training progress" ON training_progress;
DROP POLICY IF EXISTS "Managers can view all certifications" ON certifications;

-- Create a function to check if current user is a manager
-- This uses auth.uid() without querying users table recursively
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM manager_profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create policies using this function

-- Users table - allow managers to view all users
CREATE POLICY "Managers can view all users" ON users
  FOR SELECT USING (is_manager());

-- Worker profiles
CREATE POLICY "Managers can view all worker profiles" ON worker_profiles
  FOR SELECT USING (is_manager());

-- Daily check-ins
CREATE POLICY "Managers can view all check-ins" ON daily_check_ins
  FOR SELECT USING (is_manager());

-- Incidents
CREATE POLICY "Managers can view all incidents" ON incidents
  FOR SELECT USING (is_manager());

DROP POLICY IF EXISTS "Managers can update incidents" ON incidents;
CREATE POLICY "Managers can update incidents" ON incidents
  FOR UPDATE USING (is_manager());

-- Safety alerts
CREATE POLICY "Managers can view all safety alerts" ON safety_alerts
  FOR SELECT USING (is_manager());

DROP POLICY IF EXISTS "Managers can update safety alerts" ON safety_alerts;
CREATE POLICY "Managers can update safety alerts" ON safety_alerts
  FOR UPDATE USING (is_manager());

-- Training progress
CREATE POLICY "Managers can view all training progress" ON training_progress
  FOR SELECT USING (is_manager());

-- Training lessons (everyone can view)
DROP POLICY IF EXISTS "Everyone can view training lessons" ON training_lessons;
CREATE POLICY "Everyone can view training lessons" ON training_lessons
  FOR SELECT USING (true);

-- Certifications
CREATE POLICY "Managers can view all certifications" ON certifications
  FOR SELECT USING (is_manager());

-- Manager profiles (allow managers to view their own and others)
DROP POLICY IF EXISTS "Managers can view all manager profiles" ON manager_profiles;
CREATE POLICY "Managers can view all manager profiles" ON manager_profiles
  FOR SELECT USING (is_manager());

-- Jobs (managers can view all)
DROP POLICY IF EXISTS "Managers can view all jobs" ON jobs;
CREATE POLICY "Managers can view all jobs" ON jobs
  FOR SELECT USING (is_manager());

-- Job applications (managers can view all)
DROP POLICY IF EXISTS "Managers can view all job applications" ON job_applications;
CREATE POLICY "Managers can view all job applications" ON job_applications
  FOR SELECT USING (is_manager());

-- Notifications (managers can view all)
DROP POLICY IF EXISTS "Managers can view all notifications" ON notifications;
CREATE POLICY "Managers can view all notifications" ON notifications
  FOR SELECT USING (is_manager());

-- Work shifts (managers can view all)
DROP POLICY IF EXISTS "Managers can view all work shifts" ON work_shifts;
CREATE POLICY "Managers can view all work shifts" ON work_shifts
  FOR SELECT USING (is_manager());
