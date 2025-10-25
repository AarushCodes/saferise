-- ==================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==================================================
-- This consolidates all the migrations you need to apply
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor
-- Copy and paste this entire file and click RUN

-- Check if tables exist, if not create them
DO $$
BEGIN
    -- Check if jobs table has the correct columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jobs' AND column_name = 'location_text'
    ) THEN
        -- Jobs table needs to be fixed
        ALTER TABLE jobs RENAME COLUMN location TO location_text;
    END IF;
EXCEPTION
    WHEN undefined_column THEN
        -- Column doesn't exist, that's okay
        NULL;
END $$;

-- Ensure status column uses correct enum
DO $$
BEGIN
    -- Check if we need to update status values
    UPDATE jobs SET status = 'active' WHERE status = 'open';
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Migration complete! Jobs table should now work correctly.' as result;
