-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add room_id to classes table (tipo de aula)
ALTER TABLE public.classes ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Add default_instructor_id to classes table for default instructor
ALTER TABLE public.classes ADD COLUMN default_instructor_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- Add has_fixed_schedule to classes table (optional schedule)
ALTER TABLE public.classes ADD COLUMN has_fixed_schedule BOOLEAN DEFAULT false;
ALTER TABLE public.classes ADD COLUMN default_start_time TIME;
ALTER TABLE public.classes ADD COLUMN default_end_time TIME;
ALTER TABLE public.classes ADD COLUMN default_days_of_week INTEGER[];

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- RLS policies for rooms
CREATE POLICY "Users can view rooms of their company"
ON public.rooms FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage rooms of their company"
ON public.rooms FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_rooms_company_id ON public.rooms(company_id);
CREATE INDEX idx_classes_room_id ON public.classes(room_id);
CREATE INDEX idx_classes_default_instructor_id ON public.classes(default_instructor_id);

-- Trigger for updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();