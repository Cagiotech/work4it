-- Add RLS policies for staff to access nutrition plans of students in their company
-- (Staff members don't have profiles with company_id, they have staff.company_id)

-- nutrition_meal_plans - Staff can view/manage nutrition plans of students they're assigned to
CREATE POLICY "Staff can view nutrition plans of assigned students"
ON public.nutrition_meal_plans
FOR SELECT
USING (
  student_id IN (
    SELECT students.id
    FROM students
    WHERE students.personal_trainer_id IN (
      SELECT staff.id FROM staff WHERE staff.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can manage nutrition plans of assigned students"
ON public.nutrition_meal_plans
FOR ALL
USING (
  student_id IN (
    SELECT students.id
    FROM students
    WHERE students.personal_trainer_id IN (
      SELECT staff.id FROM staff WHERE staff.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  student_id IN (
    SELECT students.id
    FROM students
    WHERE students.personal_trainer_id IN (
      SELECT staff.id FROM staff WHERE staff.user_id = auth.uid()
    )
  )
);

-- nutrition_plan_days - Staff can view/manage days of nutrition plans they have access to
CREATE POLICY "Staff can view nutrition plan days of assigned students"
ON public.nutrition_plan_days
FOR SELECT
USING (
  plan_id IN (
    SELECT nmp.id FROM nutrition_meal_plans nmp
    WHERE nmp.student_id IN (
      SELECT s.id FROM students s
      WHERE s.personal_trainer_id IN (
        SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Staff can manage nutrition plan days of assigned students"
ON public.nutrition_plan_days
FOR ALL
USING (
  plan_id IN (
    SELECT nmp.id FROM nutrition_meal_plans nmp
    WHERE nmp.student_id IN (
      SELECT s.id FROM students s
      WHERE s.personal_trainer_id IN (
        SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  plan_id IN (
    SELECT nmp.id FROM nutrition_meal_plans nmp
    WHERE nmp.student_id IN (
      SELECT s.id FROM students s
      WHERE s.personal_trainer_id IN (
        SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
      )
    )
  )
);

-- nutrition_plan_meals - Staff can view/manage meals of nutrition plans they have access to
CREATE POLICY "Staff can view nutrition meals of assigned students"
ON public.nutrition_plan_meals
FOR SELECT
USING (
  day_id IN (
    SELECT npd.id FROM nutrition_plan_days npd
    WHERE npd.plan_id IN (
      SELECT nmp.id FROM nutrition_meal_plans nmp
      WHERE nmp.student_id IN (
        SELECT s.id FROM students s
        WHERE s.personal_trainer_id IN (
          SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Staff can manage nutrition meals of assigned students"
ON public.nutrition_plan_meals
FOR ALL
USING (
  day_id IN (
    SELECT npd.id FROM nutrition_plan_days npd
    WHERE npd.plan_id IN (
      SELECT nmp.id FROM nutrition_meal_plans nmp
      WHERE nmp.student_id IN (
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
    SELECT npd.id FROM nutrition_plan_days npd
    WHERE npd.plan_id IN (
      SELECT nmp.id FROM nutrition_meal_plans nmp
      WHERE nmp.student_id IN (
        SELECT s.id FROM students s
        WHERE s.personal_trainer_id IN (
          SELECT st.id FROM staff st WHERE st.user_id = auth.uid()
        )
      )
    )
  )
);

-- Also add policy for staff to view students they're assigned to (beyond just personal_trainer_id)
-- Staff in same company should be able to view all students in that company
CREATE POLICY "Staff can view students of their company"
ON public.students
FOR SELECT
USING (
  company_id IN (
    SELECT staff.company_id FROM staff WHERE staff.user_id = auth.uid()
  )
);