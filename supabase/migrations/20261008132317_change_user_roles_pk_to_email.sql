-- Change primary key from (user_id, role_id) to (email, role_id)
-- so roles can be assigned by email before the user has signed in.
ALTER TABLE user_roles DROP CONSTRAINT user_roles_pkey;

ALTER TABLE user_roles ADD PRIMARY KEY (email, role_id);

-- Make user_id nullable so email-only assignments work
ALTER TABLE user_roles ALTER COLUMN user_id DROP NOT NULL;
