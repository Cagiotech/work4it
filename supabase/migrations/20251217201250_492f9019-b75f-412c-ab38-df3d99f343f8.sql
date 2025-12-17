-- Create equipment categories table
CREATE TABLE public.equipment_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#aeca12',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.equipment_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  status TEXT NOT NULL DEFAULT 'operational',
  purchase_date DATE,
  purchase_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  warranty_expiry DATE,
  location TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment maintenance table
CREATE TABLE public.equipment_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  performed_by TEXT,
  performed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  next_maintenance_date DATE,
  cost NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equipment_categories
CREATE POLICY "Users can view categories of their company" ON public.equipment_categories
  FOR SELECT USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can manage categories of their company" ON public.equipment_categories
  FOR ALL USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for equipment
CREATE POLICY "Users can view equipment of their company" ON public.equipment
  FOR SELECT USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can manage equipment of their company" ON public.equipment
  FOR ALL USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for equipment_maintenance
CREATE POLICY "Users can view maintenance of their company" ON public.equipment_maintenance
  FOR SELECT USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can manage maintenance of their company" ON public.equipment_maintenance
  FOR ALL USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_equipment_categories_updated_at
  BEFORE UPDATE ON public.equipment_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_maintenance_updated_at
  BEFORE UPDATE ON public.equipment_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();