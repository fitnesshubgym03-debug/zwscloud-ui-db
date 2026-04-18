-- Update admin_profiles table to support email and password authentication
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS hashed_password TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON public.admin_profiles(email);
