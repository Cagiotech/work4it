-- Add admin access policies to all tables
-- Admin should be able to view ALL data from ALL companies

-- Companies
CREATE POLICY "Admin can view all companies"
ON public.companies FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all companies"
ON public.companies FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Profiles
CREATE POLICY "Admin can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Students
CREATE POLICY "Admin can view all students"
ON public.students FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all students"
ON public.students FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff
CREATE POLICY "Admin can view all staff"
ON public.staff FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff"
ON public.staff FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Classes
CREATE POLICY "Admin can view all classes"
ON public.classes FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all classes"
ON public.classes FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Class Schedules
CREATE POLICY "Admin can view all class schedules"
ON public.class_schedules FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all class schedules"
ON public.class_schedules FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Class Enrollments
CREATE POLICY "Admin can view all class enrollments"
ON public.class_enrollments FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all class enrollments"
ON public.class_enrollments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Financial Transactions
CREATE POLICY "Admin can view all financial transactions"
ON public.financial_transactions FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all financial transactions"
ON public.financial_transactions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Financial Categories
CREATE POLICY "Admin can view all financial categories"
ON public.financial_categories FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all financial categories"
ON public.financial_categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Equipment
CREATE POLICY "Admin can view all equipment"
ON public.equipment FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all equipment"
ON public.equipment FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Equipment Categories
CREATE POLICY "Admin can view all equipment categories"
ON public.equipment_categories FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all equipment categories"
ON public.equipment_categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Equipment Maintenance
CREATE POLICY "Admin can view all equipment maintenance"
ON public.equipment_maintenance FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all equipment maintenance"
ON public.equipment_maintenance FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Events
CREATE POLICY "Admin can view all events"
ON public.events FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all events"
ON public.events FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Messages
CREATE POLICY "Admin can view all messages"
ON public.messages FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all messages"
ON public.messages FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Roles
CREATE POLICY "Admin can view all roles"
ON public.roles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all roles"
ON public.roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Role Permissions
CREATE POLICY "Admin can view all role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all role permissions"
ON public.role_permissions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Rooms
CREATE POLICY "Admin can view all rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all rooms"
ON public.rooms FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Student Subscriptions
CREATE POLICY "Admin can view all student subscriptions"
ON public.student_subscriptions FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all student subscriptions"
ON public.student_subscriptions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Subscription Plans
CREATE POLICY "Admin can view all subscription plans"
ON public.subscription_plans FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all subscription plans"
ON public.subscription_plans FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Student Anamnesis
CREATE POLICY "Admin can view all student anamnesis"
ON public.student_anamnesis FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all student anamnesis"
ON public.student_anamnesis FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Student Documents
CREATE POLICY "Admin can view all student documents"
ON public.student_documents FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all student documents"
ON public.student_documents FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Student Groups
CREATE POLICY "Admin can view all student groups"
ON public.student_groups FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all student groups"
ON public.student_groups FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Student Group Members
CREATE POLICY "Admin can view all student group members"
ON public.student_group_members FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all student group members"
ON public.student_group_members FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Student Notes
CREATE POLICY "Admin can view all student notes"
ON public.student_notes FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all student notes"
ON public.student_notes FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Student Nutrition Plans
CREATE POLICY "Admin can view all student nutrition plans"
ON public.student_nutrition_plans FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all student nutrition plans"
ON public.student_nutrition_plans FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Nutrition Meal Plans
CREATE POLICY "Admin can view all nutrition meal plans"
ON public.nutrition_meal_plans FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all nutrition meal plans"
ON public.nutrition_meal_plans FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Nutrition Plan Days
CREATE POLICY "Admin can view all nutrition plan days"
ON public.nutrition_plan_days FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all nutrition plan days"
ON public.nutrition_plan_days FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Nutrition Plan Meals
CREATE POLICY "Admin can view all nutrition plan meals"
ON public.nutrition_plan_meals FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all nutrition plan meals"
ON public.nutrition_plan_meals FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Payment Proofs
CREATE POLICY "Admin can view all payment proofs"
ON public.payment_proofs FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all payment proofs"
ON public.payment_proofs FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Signed Documents
CREATE POLICY "Admin can view all signed documents"
ON public.signed_documents FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all signed documents"
ON public.signed_documents FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff Absences
CREATE POLICY "Admin can view all staff absences"
ON public.staff_absences FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff absences"
ON public.staff_absences FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff Documents
CREATE POLICY "Admin can view all staff documents"
ON public.staff_documents FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff documents"
ON public.staff_documents FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff Evaluations
CREATE POLICY "Admin can view all staff evaluations"
ON public.staff_evaluations FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff evaluations"
ON public.staff_evaluations FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff Leave Balances
CREATE POLICY "Admin can view all staff leave balances"
ON public.staff_leave_balances FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff leave balances"
ON public.staff_leave_balances FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff Payment Config
CREATE POLICY "Admin can view all staff payment config"
ON public.staff_payment_config FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff payment config"
ON public.staff_payment_config FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff Time Records
CREATE POLICY "Admin can view all staff time records"
ON public.staff_time_records FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff time records"
ON public.staff_time_records FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff Trainings
CREATE POLICY "Admin can view all staff trainings"
ON public.staff_trainings FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff trainings"
ON public.staff_trainings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Staff Work Schedules
CREATE POLICY "Admin can view all staff work schedules"
ON public.staff_work_schedules FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all staff work schedules"
ON public.staff_work_schedules FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- User Roles - Admin full access
CREATE POLICY "Admin can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Training Plans
CREATE POLICY "Admin can view all training plans"
ON public.training_plans FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all training plans"
ON public.training_plans FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Training Plan Exercises
CREATE POLICY "Admin can view all training plan exercises"
ON public.training_plan_exercises FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can manage all training plan exercises"
ON public.training_plan_exercises FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());