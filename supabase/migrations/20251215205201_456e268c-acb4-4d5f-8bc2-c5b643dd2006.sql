-- Allow students to view their own record
CREATE POLICY "Students can view their own record" 
ON public.students 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow students to update their own record
CREATE POLICY "Students can update their own record" 
ON public.students 
FOR UPDATE 
USING (user_id = auth.uid());

-- Allow students to view their own anamnesis
CREATE POLICY "Students can view their own anamnesis" 
ON public.student_anamnesis 
FOR SELECT 
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Allow students to manage their own anamnesis (when anamnesis_filled_by = 'student')
CREATE POLICY "Students can manage their own anamnesis" 
ON public.student_anamnesis 
FOR ALL 
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Allow students to view their own documents
CREATE POLICY "Students can view their own documents" 
ON public.student_documents 
FOR SELECT 
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Allow students to view their own nutrition plans
CREATE POLICY "Students can view their own nutrition plans" 
ON public.student_nutrition_plans 
FOR SELECT 
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Allow students to view their own subscriptions
CREATE POLICY "Students can view their own subscriptions" 
ON public.student_subscriptions 
FOR SELECT 
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Allow students to view their company info (for terms/regulations)
CREATE POLICY "Students can view their company" 
ON public.companies 
FOR SELECT 
USING (id IN (SELECT company_id FROM students WHERE user_id = auth.uid()));