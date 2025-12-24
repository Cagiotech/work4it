-- Create table to associate staff (trainers) with classes (modalities)
CREATE TABLE public.staff_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, class_id)
);

-- Enable RLS
ALTER TABLE public.staff_classes ENABLE ROW LEVEL SECURITY;

-- Admin can manage all
CREATE POLICY "Admin can manage all staff_classes"
  ON public.staff_classes
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Company users can manage staff_classes
CREATE POLICY "Company users can manage staff_classes"
  ON public.staff_classes
  FOR ALL
  USING (
    staff_id IN (
      SELECT s.id FROM staff s 
      WHERE s.company_id IN (
        SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT s.id FROM staff s 
      WHERE s.company_id IN (
        SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
      )
    )
  );

-- Staff can view their own class assignments
CREATE POLICY "Staff can view their own class assignments"
  ON public.staff_classes
  FOR SELECT
  USING (
    staff_id IN (
      SELECT s.id FROM staff s WHERE s.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_staff_classes_staff_id ON public.staff_classes(staff_id);
CREATE INDEX idx_staff_classes_class_id ON public.staff_classes(class_id);

-- Add trigger for updated_at
CREATE TRIGGER update_staff_classes_updated_at
  BEFORE UPDATE ON public.staff_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();