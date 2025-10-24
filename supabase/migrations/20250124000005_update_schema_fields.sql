-- Update daily_check_ins to add the fields the manager dashboard expects
ALTER TABLE daily_check_ins
ADD COLUMN IF NOT EXISTS feeling TEXT,
ADD COLUMN IF NOT EXISTS sleep_hours INTEGER,
ADD COLUMN IF NOT EXISTS concerns TEXT;

-- Rename jobs columns to match the code (keep data)
ALTER TABLE jobs RENAME COLUMN pay_per_day TO pay_rate_numeric;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pay_rate TEXT;
UPDATE jobs SET pay_rate = pay_rate_numeric::TEXT || '/day' WHERE pay_rate IS NULL;
ALTER TABLE jobs DROP COLUMN pay_rate_numeric;

ALTER TABLE jobs RENAME COLUMN location_text TO location;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_workers INTEGER DEFAULT 1;

-- Update job_status enum to match code
DO $$
BEGIN
  -- First check if we need to update
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    -- Create new enum type
    CREATE TYPE job_status_new AS ENUM ('open', 'in_progress', 'completed');

    -- Update jobs table to use new enum
    ALTER TABLE jobs ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE jobs ALTER COLUMN status TYPE job_status_new USING
      CASE
        WHEN status::text = 'active' THEN 'open'::job_status_new
        WHEN status::text = 'filled' THEN 'in_progress'::job_status_new
        WHEN status::text = 'closed' THEN 'completed'::job_status_new
        ELSE 'open'::job_status_new
      END;
    ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'open'::job_status_new;

    -- Drop old enum and rename new one
    DROP TYPE job_status;
    ALTER TYPE job_status_new RENAME TO job_status;
  END IF;
END $$;
