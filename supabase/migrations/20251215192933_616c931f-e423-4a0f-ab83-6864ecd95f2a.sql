-- Add created_by to companies to support ownership and fix onboarding flow
ALTER TABLE public.companies
ADD COLUMN created_by UUID NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);

-- Recreate companies RLS policies to use created_by
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own company" ON public.companies;

CREATE POLICY "Users can insert their own company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (
    SELECT profiles.company_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (
    SELECT profiles.company_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company"
ON public.companies
FOR DELETE
TO authenticated
USING (created_by = auth.uid());