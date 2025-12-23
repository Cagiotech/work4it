-- Drop existing policies that allow public access
DROP POLICY IF EXISTS "Anyone can view active admin plans" ON public.admin_plans;
DROP POLICY IF EXISTS "Users can view active banners for their audience" ON public.admin_banners;

-- Create more restrictive policy for admin_plans - only authenticated users can view
CREATE POLICY "Authenticated users can view active plans"
ON public.admin_plans
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create more restrictive policy for admin_banners - only authenticated users can view
-- This prevents exposing created_by field to unauthenticated users
CREATE POLICY "Authenticated users can view active banners"
ON public.admin_banners
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (starts_at IS NULL OR starts_at <= now()) 
  AND (ends_at IS NULL OR ends_at > now())
);