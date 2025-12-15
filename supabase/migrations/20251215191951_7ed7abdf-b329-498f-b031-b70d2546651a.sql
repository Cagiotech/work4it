-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate policies as PERMISSIVE (default)
CREATE POLICY "Authenticated users can insert companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own company"
ON public.companies FOR SELECT
TO authenticated
USING (
  id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own company"
ON public.companies FOR UPDATE
TO authenticated
USING (
  id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());