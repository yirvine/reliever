-- Add email_verified column to users table
-- This tracks whether the user has verified their email address in Firebase

ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on verified users
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Update existing users (if any) - assume they're verified if they exist
-- (since we just added email verification requirement)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address via Firebase Auth';

