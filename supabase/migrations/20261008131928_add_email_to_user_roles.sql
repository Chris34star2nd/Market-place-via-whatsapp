-- Add email column to user_roles so admins can assign roles by email
-- before the user has signed in. When the user signs in with Google,
-- their email is matched against this column to determine their role.
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS email text;

-- Make (email, role_id) the natural unique key so the same person
-- can't be assigned the same role twice.
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_email_role_unique
  ON user_roles(email, role_id);

-- Allow querying by email without needing user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
