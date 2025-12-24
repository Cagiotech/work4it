-- Tabela para vincular alunos a modalidades/classes específicas
CREATE TABLE public.student_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.staff(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Enable RLS
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admin full access
CREATE POLICY "Admin can manage all student classes"
ON public.student_classes FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Company users can manage student classes
CREATE POLICY "Company users can manage student classes"
ON public.student_classes FOR ALL
USING (
  student_id IN (
    SELECT id FROM students 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Staff can manage student classes for their assigned students
CREATE POLICY "Staff can manage student classes for assigned students"
ON public.student_classes FOR ALL
USING (
  student_id IN (
    SELECT id FROM students 
    WHERE personal_trainer_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students 
    WHERE personal_trainer_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
  )
);

-- Students can view their own classes
CREATE POLICY "Students can view their own classes"
ON public.student_classes FOR SELECT
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- Add updated_at trigger
CREATE TRIGGER update_student_classes_updated_at
BEFORE UPDATE ON public.student_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();