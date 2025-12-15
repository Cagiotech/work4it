-- Create classes table (class templates/types)
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  capacity INTEGER NOT NULL DEFAULT 10,
  color TEXT DEFAULT '#aeca12',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_schedules table (specific scheduled sessions)
CREATE TABLE public.class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_enrollments table (student registrations for classes)
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_schedule_id UUID NOT NULL REFERENCES public.class_schedules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'no_show', 'cancelled')),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_schedule_id, student_id)
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
CREATE POLICY "Users can view classes of their company"
ON public.classes FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage classes of their company"
ON public.classes FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for class_schedules
CREATE POLICY "Users can view class schedules of their company"
ON public.class_schedules FOR SELECT
USING (class_id IN (SELECT id FROM classes WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage class schedules of their company"
ON public.class_schedules FOR ALL
USING (class_id IN (SELECT id FROM classes WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())))
WITH CHECK (class_id IN (SELECT id FROM classes WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

-- RLS policies for class_enrollments
CREATE POLICY "Users can view enrollments of their company"
ON public.class_enrollments FOR SELECT
USING (class_schedule_id IN (
  SELECT cs.id FROM class_schedules cs
  JOIN classes c ON cs.class_id = c.id
  WHERE c.company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can manage enrollments of their company"
ON public.class_enrollments FOR ALL
USING (class_schedule_id IN (
  SELECT cs.id FROM class_schedules cs
  JOIN classes c ON cs.class_id = c.id
  WHERE c.company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
))
WITH CHECK (class_schedule_id IN (
  SELECT cs.id FROM class_schedules cs
  JOIN classes c ON cs.class_id = c.id
  WHERE c.company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
));

-- Students can view their own enrollments
CREATE POLICY "Students can view their own enrollments"
ON public.class_enrollments FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_classes_company ON public.classes(company_id);
CREATE INDEX idx_class_schedules_class ON public.class_schedules(class_id);
CREATE INDEX idx_class_schedules_date ON public.class_schedules(scheduled_date);
CREATE INDEX idx_class_enrollments_schedule ON public.class_enrollments(class_schedule_id);
CREATE INDEX idx_class_enrollments_student ON public.class_enrollments(student_id);

-- Add triggers for updated_at
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_schedules_updated_at
BEFORE UPDATE ON public.class_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();