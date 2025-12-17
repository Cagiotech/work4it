-- Create training plans table
CREATE TABLE public.training_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training plan days (one entry per day of the week)
CREATE TABLE public.training_plan_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  title TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, day_of_week)
);

-- Create exercises for each training day
CREATE TABLE public.training_plan_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.training_plan_days(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  sets INTEGER,
  reps TEXT,
  weight TEXT,
  rest_seconds INTEGER,
  notes TEXT,
  video_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add day_of_week to nutrition plans for weekly meal structure
ALTER TABLE public.student_nutrition_plans
ADD COLUMN IF NOT EXISTS day_of_week INTEGER,
ADD COLUMN IF NOT EXISTS meal_type TEXT;

-- Create nutrition meal plans table for structured meals
CREATE TABLE public.nutrition_meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal plan days
CREATE TABLE public.nutrition_plan_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.nutrition_meal_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  calories_target INTEGER,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, day_of_week)
);

-- Create meals for each day
CREATE TABLE public.nutrition_plan_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.nutrition_plan_days(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  meal_time TIME,
  description TEXT,
  foods TEXT,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plan_meals ENABLE ROW LEVEL SECURITY;

-- Training plans policies
CREATE POLICY "Users can view training plans of their company students" 
ON public.training_plans FOR SELECT 
USING (student_id IN (
  SELECT id FROM public.students WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage training plans of their company students" 
ON public.training_plans FOR ALL 
USING (student_id IN (
  SELECT id FROM public.students WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
))
WITH CHECK (student_id IN (
  SELECT id FROM public.students WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Students can view their own training plans" 
ON public.training_plans FOR SELECT 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

-- Training plan days policies
CREATE POLICY "Users can view training plan days of their company" 
ON public.training_plan_days FOR SELECT 
USING (plan_id IN (
  SELECT id FROM public.training_plans WHERE student_id IN (
    SELECT id FROM public.students WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Users can manage training plan days of their company" 
ON public.training_plan_days FOR ALL 
USING (plan_id IN (
  SELECT id FROM public.training_plans WHERE student_id IN (
    SELECT id FROM public.students WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
))
WITH CHECK (plan_id IN (
  SELECT id FROM public.training_plans WHERE student_id IN (
    SELECT id FROM public.students WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Students can view their own training plan days" 
ON public.training_plan_days FOR SELECT 
USING (plan_id IN (
  SELECT id FROM public.training_plans WHERE student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
));

-- Training plan exercises policies
CREATE POLICY "Users can view training exercises of their company" 
ON public.training_plan_exercises FOR SELECT 
USING (day_id IN (
  SELECT id FROM public.training_plan_days WHERE plan_id IN (
    SELECT id FROM public.training_plans WHERE student_id IN (
      SELECT id FROM public.students WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
));

CREATE POLICY "Users can manage training exercises of their company" 
ON public.training_plan_exercises FOR ALL 
USING (day_id IN (
  SELECT id FROM public.training_plan_days WHERE plan_id IN (
    SELECT id FROM public.training_plans WHERE student_id IN (
      SELECT id FROM public.students WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
))
WITH CHECK (day_id IN (
  SELECT id FROM public.training_plan_days WHERE plan_id IN (
    SELECT id FROM public.training_plans WHERE student_id IN (
      SELECT id FROM public.students WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
));

CREATE POLICY "Students can view their own training exercises" 
ON public.training_plan_exercises FOR SELECT 
USING (day_id IN (
  SELECT id FROM public.training_plan_days WHERE plan_id IN (
    SELECT id FROM public.training_plans WHERE student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  )
));

-- Nutrition meal plans policies (similar structure)
CREATE POLICY "Users can view nutrition plans of their company students" 
ON public.nutrition_meal_plans FOR SELECT 
USING (student_id IN (
  SELECT id FROM public.students WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage nutrition plans of their company students" 
ON public.nutrition_meal_plans FOR ALL 
USING (student_id IN (
  SELECT id FROM public.students WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
))
WITH CHECK (student_id IN (
  SELECT id FROM public.students WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Students can view their own nutrition plans" 
ON public.nutrition_meal_plans FOR SELECT 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

-- Nutrition plan days policies
CREATE POLICY "Users can view nutrition plan days of their company" 
ON public.nutrition_plan_days FOR SELECT 
USING (plan_id IN (
  SELECT id FROM public.nutrition_meal_plans WHERE student_id IN (
    SELECT id FROM public.students WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Users can manage nutrition plan days of their company" 
ON public.nutrition_plan_days FOR ALL 
USING (plan_id IN (
  SELECT id FROM public.nutrition_meal_plans WHERE student_id IN (
    SELECT id FROM public.students WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
))
WITH CHECK (plan_id IN (
  SELECT id FROM public.nutrition_meal_plans WHERE student_id IN (
    SELECT id FROM public.students WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Students can view their own nutrition plan days" 
ON public.nutrition_plan_days FOR SELECT 
USING (plan_id IN (
  SELECT id FROM public.nutrition_meal_plans WHERE student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
));

-- Nutrition plan meals policies
CREATE POLICY "Users can view nutrition meals of their company" 
ON public.nutrition_plan_meals FOR SELECT 
USING (day_id IN (
  SELECT id FROM public.nutrition_plan_days WHERE plan_id IN (
    SELECT id FROM public.nutrition_meal_plans WHERE student_id IN (
      SELECT id FROM public.students WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
));

CREATE POLICY "Users can manage nutrition meals of their company" 
ON public.nutrition_plan_meals FOR ALL 
USING (day_id IN (
  SELECT id FROM public.nutrition_plan_days WHERE plan_id IN (
    SELECT id FROM public.nutrition_meal_plans WHERE student_id IN (
      SELECT id FROM public.students WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
))
WITH CHECK (day_id IN (
  SELECT id FROM public.nutrition_plan_days WHERE plan_id IN (
    SELECT id FROM public.nutrition_meal_plans WHERE student_id IN (
      SELECT id FROM public.students WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
));

CREATE POLICY "Students can view their own nutrition meals" 
ON public.nutrition_plan_meals FOR SELECT 
USING (day_id IN (
  SELECT id FROM public.nutrition_plan_days WHERE plan_id IN (
    SELECT id FROM public.nutrition_meal_plans WHERE student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  )
));

-- Create triggers for updated_at
CREATE TRIGGER update_training_plans_updated_at
BEFORE UPDATE ON public.training_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_plan_days_updated_at
BEFORE UPDATE ON public.training_plan_days
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_meal_plans_updated_at
BEFORE UPDATE ON public.nutrition_meal_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_plan_days_updated_at
BEFORE UPDATE ON public.nutrition_plan_days
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();