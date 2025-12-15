-- Drop and recreate the INSERT policy for companies
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;

-- Create INSERT policy that allows any authenticated user to insert
CREATE POLICY "Authenticated users can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also add DELETE policy for companies (owned by user)
CREATE POLICY "Users can delete their own company"
ON public.companies
FOR DELETE
TO authenticated
USING (
  id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);