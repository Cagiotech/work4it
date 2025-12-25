-- Tabela de categorias de alunos com variáveis configuráveis
CREATE TABLE public.student_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  -- Variáveis de benefícios
  has_priority_service BOOLEAN DEFAULT false,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  has_personal_trainer BOOLEAN DEFAULT false,
  has_nutrition_plan BOOLEAN DEFAULT false,
  has_locker BOOLEAN DEFAULT false,
  free_guest_passes INTEGER DEFAULT 0,
  can_book_advance_days INTEGER DEFAULT 7,
  max_classes_per_week INTEGER,
  has_towel_service BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  custom_benefits JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Associação de alunos a categorias
CREATE TABLE public.student_category_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.student_categories(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.staff(id),
  notes TEXT,
  UNIQUE(student_id, category_id)
);

-- Biblioteca de exercícios pré-definidos
CREATE TABLE public.exercise_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT NOT NULL,
  secondary_muscles TEXT[],
  equipment TEXT,
  difficulty TEXT CHECK (difficulty IN ('iniciante', 'intermedio', 'avancado')),
  image_url TEXT,
  video_url TEXT,
  instructions TEXT,
  tips TEXT,
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de notificações do admin (global, não por empresa)
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_categories
CREATE POLICY "Company members can view their categories"
ON public.student_categories FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.company_id = student_categories.company_id
));

CREATE POLICY "Company members can manage their categories"
ON public.student_categories FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.company_id = student_categories.company_id
));

-- RLS Policies for student_category_assignments
CREATE POLICY "Company members can view assignments"
ON public.student_category_assignments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM students s
  JOIN profiles p ON p.company_id = s.company_id
  WHERE s.id = student_category_assignments.student_id AND p.user_id = auth.uid()
));

CREATE POLICY "Company members can manage assignments"
ON public.student_category_assignments FOR ALL
USING (EXISTS (
  SELECT 1 FROM students s
  JOIN profiles p ON p.company_id = s.company_id
  WHERE s.id = student_category_assignments.student_id AND p.user_id = auth.uid()
));

-- RLS Policies for exercise_library
CREATE POLICY "Company members can view exercises"
ON public.exercise_library FOR SELECT
USING (is_global = true OR EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.company_id = exercise_library.company_id
));

CREATE POLICY "Company members can manage their exercises"
ON public.exercise_library FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.company_id = exercise_library.company_id
));

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage notifications"
ON public.admin_notifications FOR ALL
USING (public.is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_student_categories_updated_at
BEFORE UPDATE ON public.student_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercise_library_updated_at
BEFORE UPDATE ON public.exercise_library
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;