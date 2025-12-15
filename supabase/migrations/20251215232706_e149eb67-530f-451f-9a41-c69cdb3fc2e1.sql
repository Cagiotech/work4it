-- Create student_groups table
CREATE TABLE public.student_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#aeca12',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_group_members table
CREATE TABLE public.student_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, student_id)
);

-- Enable RLS
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_group_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_groups
CREATE POLICY "Users can view groups of their company"
ON public.student_groups
FOR SELECT
USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can manage groups of their company"
ON public.student_groups
FOR ALL
USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS policies for student_group_members
CREATE POLICY "Users can view group members of their company"
ON public.student_group_members
FOR SELECT
USING (group_id IN (
  SELECT id FROM public.student_groups 
  WHERE company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
));

CREATE POLICY "Users can manage group members of their company"
ON public.student_group_members
FOR ALL
USING (group_id IN (
  SELECT id FROM public.student_groups 
  WHERE company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
))
WITH CHECK (group_id IN (
  SELECT id FROM public.student_groups 
  WHERE company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
));

-- Create indexes
CREATE INDEX idx_student_groups_company_id ON public.student_groups(company_id);
CREATE INDEX idx_student_group_members_group_id ON public.student_group_members(group_id);
CREATE INDEX idx_student_group_members_student_id ON public.student_group_members(student_id);

-- Add updated_at trigger
CREATE TRIGGER update_student_groups_updated_at
  BEFORE UPDATE ON public.student_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();