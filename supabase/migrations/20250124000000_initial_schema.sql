-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('worker', 'manager', 'contractor');
CREATE TYPE experience_level AS ENUM ('0-1', '1-3', '3-5', '5+');
CREATE TYPE incident_type AS ENUM ('near-miss', 'unsafe-condition');
CREATE TYPE job_status AS ENUM ('active', 'filled', 'closed');
CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'accepted', 'rejected');
CREATE TYPE alert_status AS ENUM ('unresponded', 'safe', 'emergency');
CREATE TYPE notification_type AS ENUM ('job_posted', 'application_status', 'fall_alert', 'check_in_reminder');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker profiles
CREATE TABLE worker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  experience experience_level NOT NULL,
  is_certified BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manager profiles
CREATE TABLE manager_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor profiles
CREATE TABLE contractor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily safety check-ins
CREATE TABLE daily_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  wearing_ppe BOOLEAN NOT NULL,
  scaffolding_secure BOOLEAN NOT NULL,
  weather_safe BOOLEAN NOT NULL,
  feeling_alert BOOLEAN NOT NULL,
  photo_url TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident reports
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  type incident_type NOT NULL,
  photo_url TEXT NOT NULL,
  voice_note_url TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_text TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety alerts (fall detection)
CREATE TABLE safety_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  status alert_status NOT NULL DEFAULT 'unresponded',
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_text TEXT,
  response_time INTEGER, -- seconds until response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Training lessons
CREATE TABLE training_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  order_num INTEGER NOT NULL,
  questions JSONB NOT NULL, -- Array of quiz questions with answers
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training progress
CREATE TABLE training_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES training_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  quiz_score INTEGER, -- out of 3
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, lesson_id)
);

-- Certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  certificate_url TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posted_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pay_per_day DECIMAL(10, 2) NOT NULL,
  location_text TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  requires_certification BOOLEAN DEFAULT FALSE,
  status job_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job applications
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (job_id, application_id, etc.)
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work shifts (for fall detection tracking)
CREATE TABLE work_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_check_ins_worker ON daily_check_ins(worker_id, created_at DESC);
CREATE INDEX idx_incidents_worker ON incidents(worker_id, created_at DESC);
CREATE INDEX idx_alerts_worker ON safety_alerts(worker_id, created_at DESC);
CREATE INDEX idx_alerts_status ON safety_alerts(status, created_at DESC);
CREATE INDEX idx_jobs_status ON jobs(status, created_at DESC);
CREATE INDEX idx_job_applications_worker ON job_applications(worker_id, applied_at DESC);
CREATE INDEX idx_job_applications_job ON job_applications(job_id, status);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_work_shifts_worker ON work_shifts(worker_id, start_time DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Worker profiles: workers can read/update own, managers can read all
CREATE POLICY "Workers can view own profile" ON worker_profiles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'contractor'))
  );

CREATE POLICY "Workers can update own profile" ON worker_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Daily check-ins: workers create own, managers read all
CREATE POLICY "Workers can create own check-ins" ON daily_check_ins
  FOR INSERT WITH CHECK (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Workers can view own check-ins" ON daily_check_ins
  FOR SELECT USING (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
  );

-- Incidents: workers create/view own, managers view all
CREATE POLICY "Workers can create incidents" ON incidents
  FOR INSERT WITH CHECK (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Incidents are viewable by workers and managers" ON incidents
  FOR SELECT USING (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
  );

CREATE POLICY "Managers can update incidents" ON incidents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
  );

-- Safety alerts: similar to incidents
CREATE POLICY "Alerts can be created for workers" ON safety_alerts
  FOR INSERT WITH CHECK (true); -- System can create alerts

CREATE POLICY "Alerts viewable by workers and managers" ON safety_alerts
  FOR SELECT USING (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
  );

CREATE POLICY "Workers and managers can update alerts" ON safety_alerts
  FOR UPDATE USING (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
  );

-- Training lessons: everyone can read
CREATE POLICY "Training lessons are public" ON training_lessons
  FOR SELECT USING (true);

-- Training progress: workers manage own
CREATE POLICY "Workers manage own training progress" ON training_progress
  FOR ALL USING (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
  );

-- Certifications: workers view own, managers/contractors view all
CREATE POLICY "Certifications viewable" ON certifications
  FOR SELECT USING (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'contractor'))
  );

-- Jobs: contractors/managers create, workers view
CREATE POLICY "Managers and contractors can create jobs" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'contractor'))
  );

CREATE POLICY "Jobs are viewable by all authenticated users" ON jobs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Job creators can update their jobs" ON jobs
  FOR UPDATE USING (posted_by = auth.uid());

-- Job applications: workers create/view own, job posters view their job apps
CREATE POLICY "Workers can apply to jobs" ON job_applications
  FOR INSERT WITH CHECK (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Applications viewable by worker and job poster" ON job_applications
  FOR SELECT USING (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR
    job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid())
  );

CREATE POLICY "Job posters can update applications" ON job_applications
  FOR UPDATE USING (
    job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid())
  );

-- Notifications: users view own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Work shifts: workers manage own, managers view all
CREATE POLICY "Workers manage own shifts" ON work_shifts
  FOR ALL USING (
    worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
  );

-- Insert sample training lessons
INSERT INTO training_lessons (title, description, video_url, duration_minutes, order_num, questions) VALUES
('Fall Prevention', 'Learn essential fall prevention techniques and safety measures', 'https://example.com/videos/fall-prevention.mp4', 5, 1,
  '[
    {"question": "What is the minimum height requiring fall protection?", "options": ["4 feet", "6 feet", "8 feet", "10 feet"], "correct": 1},
    {"question": "Which is NOT a proper fall prevention measure?", "options": ["Safety harness", "Guardrails", "Safety net", "Regular shoes"], "correct": 3},
    {"question": "How often should fall protection equipment be inspected?", "options": ["Monthly", "Before each use", "Yearly", "When damaged"], "correct": 1}
  ]'::jsonb
),
('PPE & Equipment', 'Understanding Personal Protective Equipment requirements', 'https://example.com/videos/ppe-equipment.mp4', 5, 2,
  '[
    {"question": "What does PPE stand for?", "options": ["Personal Protective Equipment", "Primary Protection Equipment", "Professional Protective Equipment", "Proper Protection Equipment"], "correct": 0},
    {"question": "Which is NOT essential PPE for construction?", "options": ["Hard hat", "Safety vest", "Safety boots", "Sunglasses"], "correct": 3},
    {"question": "When should you wear a safety harness?", "options": ["Only when required", "Working above 6 feet", "All the time", "When convenient"], "correct": 1}
  ]'::jsonb
),
('Emergency Response', 'Proper procedures for workplace emergencies', 'https://example.com/videos/emergency-response.mp4', 5, 3,
  '[
    {"question": "What should you do first in an emergency?", "options": ["Call family", "Alert supervisor", "Leave site", "Take photos"], "correct": 1},
    {"question": "What does the emergency siren mean?", "options": ["Break time", "Lunch", "Evacuate immediately", "Meeting"], "correct": 2},
    {"question": "Where should you gather during evacuation?", "options": ["Parking lot", "Designated assembly point", "Main gate", "Anywhere safe"], "correct": 1}
  ]'::jsonb
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
