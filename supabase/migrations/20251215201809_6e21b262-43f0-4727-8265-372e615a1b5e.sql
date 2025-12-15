-- Create student_nutrition_plans table
CREATE TABLE public.student_nutrition_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  calories_target NUMERIC,
  protein_target NUMERIC,
  carbs_target NUMERIC,
  fat_target NUMERIC,
  meals TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_nutrition_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view nutrition plans of their company students" 
ON public.student_nutrition_plans 
FOR SELECT 
USING (student_id IN (
  SELECT students.id FROM students 
  WHERE students.company_id IN (
    SELECT profiles.company_id FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage nutrition plans of their company students" 
ON public.student_nutrition_plans 
FOR ALL 
USING (student_id IN (
  SELECT students.id FROM students 
  WHERE students.company_id IN (
    SELECT profiles.company_id FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
))
WITH CHECK (student_id IN (
  SELECT students.id FROM students 
  WHERE students.company_id IN (
    SELECT profiles.company_id FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
));

-- Create trigger for updated_at
CREATE TRIGGER update_student_nutrition_plans_updated_at
BEFORE UPDATE ON public.student_nutrition_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();