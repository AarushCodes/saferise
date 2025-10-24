-- Add PIN column to users table for quick sign-in
ALTER TABLE users ADD COLUMN pin TEXT;

-- Add index for faster PIN lookups
CREATE INDEX idx_users_pin ON users(pin) WHERE pin IS NOT NULL;
