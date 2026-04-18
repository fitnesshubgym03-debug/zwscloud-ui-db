-- Add Admin User Sam
-- This creates the admin user in Supabase Auth with the credentials:
-- Email: samvpslio@gmail.com
-- Password: Sam@00000 (will be auto-hashed by Supabase)

-- Insert into admin_profiles table (this works after auth user is created)
INSERT INTO public.admin_profiles (username, display_name)
VALUES ('samvpslio', 'Sam Admin')
ON CONFLICT (username) DO NOTHING;

-- Note: To create the actual auth user with password, you need to:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" and enter:
--    - Email: samvpslio@gmail.com
--    - Password: Sam@00000
--    - Check "Auto-confirm user"
-- 3. After user is created, go to their metadata and add: {"is_admin": true}
--
-- OR use the seed-admin-user.ts script:
-- pnpm seed:admin
