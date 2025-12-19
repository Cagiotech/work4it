-- Add RLS policies for staff to manage training plan days
CREATE POLICY "Staff can manage training plan days"
ON public.training_plan_days
FOR ALL
USING (
  plan_id IN (
    SELECT tp.id FROM training_plans tp
    WHERE tp.student_id IN (
      SELECT s.id FROM students s
      WHERE s.personal_trainer_id IN (
        SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  plan_id IN (
    SELECT tp.id FROM training_plans tp
    WHERE tp.student_id IN (
      SELECT s.id FROM students s
      WHERE s.personal_trainer_id IN (
        SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
      )
    )
  )
);

-- Add RLS policies for staff to manage training plan exercises
CREATE POLICY "Staff can manage training plan exercises"
ON public.training_plan_exercises
FOR ALL
USING (
  day_id IN (
    SELECT tpd.id FROM training_plan_days tpd
    WHERE tpd.plan_id IN (
      SELECT tp.id FROM training_plans tp
      WHERE tp.student_id IN (
        SELECT s.id FROM students s
        WHERE s.personal_trainer_id IN (
          SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  day_id IN (
    SELECT tpd.id FROM training_plan_days tpd
    WHERE tpd.plan_id IN (
      SELECT tp.id FROM training_plans tp
      WHERE tp.student_id IN (
        SELECT s.id FROM students s
        WHERE s.personal_trainer_id IN (
          SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
        )
      )
    )
  )
);