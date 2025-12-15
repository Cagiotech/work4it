-- Allow self-registered students to insert their own record
CREATE POLICY "Self-registered students can insert their own record" 
ON public.students 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND registration_method = 'self_registered'
);