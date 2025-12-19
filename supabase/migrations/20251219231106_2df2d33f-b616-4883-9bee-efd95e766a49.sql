-- Update function to include require_student_approval for registration flow
DROP FUNCTION IF EXISTS public.get_company_registration_info(text);

CREATE OR REPLACE FUNCTION public.get_company_registration_info(p_registration_code text)
RETURNS TABLE (
  id uuid,
  name text,
  registration_code text,
  require_student_approval boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.registration_code,
    COALESCE(c.require_student_approval, false)
  FROM companies c
  WHERE c.registration_code = p_registration_code
  LIMIT 1;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_company_registration_info(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_company_registration_info(text) TO authenticated;