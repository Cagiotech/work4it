
-- Add more fields to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS nif TEXT,
ADD COLUMN IF NOT EXISTS niss TEXT,
ADD COLUMN IF NOT EXISTS citizen_card TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Portuguesa',
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Portugal',
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS personal_trainer_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plans of their company"
ON public.subscription_plans FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage plans of their company"
ON public.subscription_plans FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Create student subscriptions table
CREATE TABLE public.student_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subscriptions of their company students"
ON public.student_subscriptions FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage subscriptions of their company students"
ON public.student_subscriptions FOR ALL
USING (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())))
WITH CHECK (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

-- Create student anamnesis (health questionnaire) table
CREATE TABLE public.student_anamnesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
  -- Physical info
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  body_fat_percentage DECIMAL(5,2),
  -- Health conditions
  has_heart_condition BOOLEAN DEFAULT false,
  has_diabetes BOOLEAN DEFAULT false,
  has_hypertension BOOLEAN DEFAULT false,
  has_respiratory_issues BOOLEAN DEFAULT false,
  has_joint_problems BOOLEAN DEFAULT false,
  has_back_problems BOOLEAN DEFAULT false,
  has_allergies BOOLEAN DEFAULT false,
  allergies_description TEXT,
  current_medications TEXT,
  previous_surgeries TEXT,
  injuries_history TEXT,
  -- Lifestyle
  is_smoker BOOLEAN DEFAULT false,
  alcohol_consumption TEXT CHECK (alcohol_consumption IN ('none', 'occasional', 'moderate', 'frequent')),
  sleep_hours_avg DECIMAL(3,1),
  stress_level TEXT CHECK (stress_level IN ('low', 'moderate', 'high', 'very_high')),
  -- Fitness background
  previous_exercise_experience TEXT,
  current_activity_level TEXT CHECK (current_activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
  fitness_goals TEXT,
  available_days_per_week INTEGER,
  preferred_training_time TEXT,
  -- Additional
  doctor_clearance BOOLEAN DEFAULT false,
  doctor_name TEXT,
  doctor_contact TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_anamnesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view anamnesis of their company students"
ON public.student_anamnesis FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage anamnesis of their company students"
ON public.student_anamnesis FOR ALL
USING (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())))
WITH CHECK (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

-- Create student notes table
CREATE TABLE public.student_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes of their company students"
ON public.student_notes FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage notes of their company students"
ON public.student_notes FOR ALL
USING (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())))
WITH CHECK (student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

-- Add triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_subscriptions_updated_at
BEFORE UPDATE ON public.student_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_anamnesis_updated_at
BEFORE UPDATE ON public.student_anamnesis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_notes_updated_at
BEFORE UPDATE ON public.student_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
