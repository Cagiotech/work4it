-- Allow staff members to view their own record
CREATE POLICY "Staff can view their own record" 
ON public.staff 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow staff members to update their own record (for password_changed)
CREATE POLICY "Staff can update their own record" 
ON public.staff 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());