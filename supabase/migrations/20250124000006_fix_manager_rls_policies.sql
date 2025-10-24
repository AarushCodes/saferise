-- Fix RLS policies to allow managers to view user data

-- Allow managers to view all user profiles
CREATE POLICY "Managers can view all user profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'manager'
    )
  );

-- Allow managers to view all worker profiles (if not already exists)
DROP POLICY IF EXISTS "Managers can view worker profiles" ON worker_profiles;
CREATE POLICY "Managers can view all worker profiles" ON worker_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- Ensure managers can view all necessary tables
-- These might already exist but let's make sure

-- Check-ins
DROP POLICY IF EXISTS "Managers can view all check-ins" ON daily_check_ins;
CREATE POLICY "Managers can view all check-ins" ON daily_check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- Incidents
DROP POLICY IF EXISTS "Managers can view all incidents" ON incidents;
CREATE POLICY "Managers can view all incidents" ON incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- Safety Alerts
DROP POLICY IF EXISTS "Managers can view all alerts" ON safety_alerts;
CREATE POLICY "Managers can view all alerts" ON safety_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- Training Progress
DROP POLICY IF EXISTS "Managers can view all training progress" ON training_progress;
CREATE POLICY "Managers can view all training progress" ON training_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- Certifications
DROP POLICY IF EXISTS "Managers can view all certifications" ON certifications;
CREATE POLICY "Managers can view all certifications" ON certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );
