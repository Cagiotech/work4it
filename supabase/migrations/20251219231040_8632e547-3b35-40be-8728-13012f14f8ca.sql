-- Fix 1: Make student-photos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'student-photos';

-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view student photos" ON storage.objects;

-- Add proper RLS policies for student photos
-- Students can view their own photos (using path pattern: student_id/filename)
CREATE POLICY "Students can view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-photos' AND
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.user_id = auth.uid()
    AND name LIKE s.id::text || '/%'
  )
);

-- Company staff (profiles) can view student photos of their company
CREATE POLICY "Company staff can view student photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-photos' AND
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.company_id = s.company_id
    WHERE p.user_id = auth.uid()
    AND name LIKE s.id::text || '/%'
  )
);

-- Staff members can view photos of students in their company
CREATE POLICY "Staff can view student photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-photos' AND
  EXISTS (
    SELECT 1 FROM students s
    JOIN staff st ON st.company_id = s.company_id
    WHERE st.user_id = auth.uid()
    AND name LIKE s.id::text || '/%'
  )
);

-- Fix 2: Replace overly permissive company policy with restricted one
DROP POLICY IF EXISTS "Public can view company registration info" ON public.companies;

-- Create a secure function to get minimal company info for registration lookup
CREATE OR REPLACE FUNCTION public.get_company_registration_info(p_registration_code text)
RETURNS TABLE (
  id uuid,
  name text,
  registration_code text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.registration_code
  FROM companies c
  WHERE c.registration_code = p_registration_code
  LIMIT 1;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_company_registration_info(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_company_registration_info(text) TO authenticated;

-- Students need to see their company after registration (for terms acceptance flow)
CREATE POLICY "Students can view full details of their company"
ON public.companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM students WHERE user_id = auth.uid()
  )
);