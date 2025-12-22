-- Add policy for staff to view student anamnesis
CREATE POLICY "Staff can view student anamnesis of their students"
ON public.student_anamnesis
FOR SELECT
USING (student_id IN (
  SELECT id FROM students WHERE personal_trainer_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
));

-- Add policy for staff to manage student anamnesis
CREATE POLICY "Staff can manage student anamnesis of their students"
ON public.student_anamnesis
FOR ALL
USING (student_id IN (
  SELECT id FROM students WHERE personal_trainer_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
))
WITH CHECK (student_id IN (
  SELECT id FROM students WHERE personal_trainer_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
));

-- Add policy for staff to view roles of their company
CREATE POLICY "Staff can view roles of their company"
ON public.roles
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM staff WHERE user_id = auth.uid()
));

-- Add policy for staff to view class enrollments
CREATE POLICY "Staff can view class enrollments of their company"
ON public.class_enrollments
FOR SELECT
USING (class_schedule_id IN (
  SELECT cs.id FROM class_schedules cs
  JOIN classes c ON cs.class_id = c.id
  WHERE c.company_id IN (
    SELECT company_id FROM staff WHERE user_id = auth.uid()
  )
));