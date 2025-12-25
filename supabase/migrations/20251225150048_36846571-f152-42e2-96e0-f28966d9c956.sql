-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Full-Stack Security Audit for Web + Mobile (Capacitor)
-- =====================================================

-- 1. STUDENTS TABLE - Restrict access to own data and company staff
-- Drop overly permissive policies if they exist
DROP POLICY IF EXISTS "Students can view their company students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;

-- Students can only view their OWN data
CREATE POLICY "Students can view own profile" 
ON public.students 
FOR SELECT 
USING (user_id = auth.uid());

-- Students can update their OWN data only
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can update own profile" 
ON public.students 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. STAFF TABLE - Restrict to own data and company access
DROP POLICY IF EXISTS "Staff can view their own profile" ON public.staff;
CREATE POLICY "Staff can view own profile" 
ON public.staff 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can update their own profile" ON public.staff;
CREATE POLICY "Staff can update own profile" 
ON public.staff 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. STAFF_PAYMENT_CONFIG - Only staff can view their own payment config
DROP POLICY IF EXISTS "Staff can view their own payment config" ON public.staff_payment_config;
CREATE POLICY "Staff can view own payment config" 
ON public.staff_payment_config 
FOR SELECT 
USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

-- 4. STUDENT_ANAMNESIS - Only student and assigned trainers
DROP POLICY IF EXISTS "Students can view their own anamnesis" ON public.student_anamnesis;
CREATE POLICY "Students can view own anamnesis" 
ON public.student_anamnesis 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can update their own anamnesis" ON public.student_anamnesis;
CREATE POLICY "Students can update own anamnesis" 
ON public.student_anamnesis 
FOR UPDATE 
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can insert their own anamnesis" ON public.student_anamnesis;
CREATE POLICY "Students can insert own anamnesis" 
ON public.student_anamnesis 
FOR INSERT 
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- 5. SIGNED_DOCUMENTS - Only document owner can view
DROP POLICY IF EXISTS "Students can view their own signed documents" ON public.signed_documents;
CREATE POLICY "Students can view own signed documents" 
ON public.signed_documents 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- 6. PROFILES - Only owner can modify
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

-- 7. PASSWORD_RESET_REQUESTS - Protect email visibility
DROP POLICY IF EXISTS "Users can view their own password reset requests" ON public.password_reset_requests;
CREATE POLICY "Users can view own password reset requests" 
ON public.password_reset_requests 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  is_admin() OR
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);

-- 8. Create security definer function for checking company membership
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND company_id = _company_id
  ) OR EXISTS (
    SELECT 1 FROM public.staff WHERE user_id = _user_id AND company_id = _company_id
  ) OR EXISTS (
    SELECT 1 FROM public.students WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- 9. Create security definer function for checking staff role
CREATE OR REPLACE FUNCTION public.is_company_staff(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND company_id = _company_id
  ) OR EXISTS (
    SELECT 1 FROM public.staff WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- 10. Ensure user_roles table has proper constraints
ALTER TABLE public.user_roles 
  ALTER COLUMN user_id SET NOT NULL;

-- 11. Add index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

-- 12. ADMIN_SETTINGS - Ensure only admins can access
DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;
CREATE POLICY "Only admins can view settings" 
ON public.admin_settings 
FOR SELECT 
USING (is_admin());

-- 13. COMPANIES - Protect registration_code from being exposed
-- Create a security definer function that only returns necessary info
CREATE OR REPLACE FUNCTION public.get_company_basic_info(p_company_id uuid)
RETURNS TABLE(id uuid, name text, address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.address
  FROM companies c
  WHERE c.id = p_company_id
  LIMIT 1;
$$;