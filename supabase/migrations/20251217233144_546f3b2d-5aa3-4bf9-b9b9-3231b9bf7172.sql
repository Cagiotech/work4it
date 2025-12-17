-- Allow staff (personal trainers) to view students assigned to them
CREATE POLICY "Staff can view assigned students" 
ON public.students 
FOR SELECT 
USING (personal_trainer_id IN (
  SELECT id FROM staff WHERE user_id = auth.uid()
));

-- Allow staff to view subscriptions of their assigned students
CREATE POLICY "Staff can view subscriptions of assigned students" 
ON public.student_subscriptions 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM students WHERE personal_trainer_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
));

-- Allow staff to view subscription plans
CREATE POLICY "Staff can view subscription plans of their company" 
ON public.subscription_plans 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM staff WHERE user_id = auth.uid()
));