-- Allow students to delete their own notifications
CREATE POLICY "Students can delete their notifications" 
ON public.notifications 
FOR DELETE 
USING (
  (company_id IN (SELECT students.company_id FROM students WHERE students.user_id = auth.uid()))
  AND (user_type = 'student' OR user_id IS NULL)
);

-- Allow staff to delete their notifications
CREATE POLICY "Staff can delete their notifications" 
ON public.notifications 
FOR DELETE 
USING (
  (company_id IN (SELECT staff.company_id FROM staff WHERE staff.user_id = auth.uid()))
  AND (user_type = 'staff' OR user_id IS NULL)
);