-- Create enum for permission actions
CREATE TYPE public.permission_action AS ENUM ('view', 'create', 'edit', 'delete', 'export', 'import');

-- Create modules table (defines all system modules)
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert all modules
INSERT INTO public.modules (key, name, description, icon, sort_order) VALUES
  ('students', 'Alunos', 'Gestão de alunos matriculados', 'Users', 1),
  ('hr', 'Recursos Humanos', 'Gestão de colaboradores e staff', 'UserCog', 2),
  ('classes', 'Aulas', 'Gestão de aulas e horários', 'Calendar', 3),
  ('communication', 'Comunicação', 'Mensagens e notificações', 'MessageSquare', 4),
  ('financial', 'Financeiro', 'Pagamentos e faturamento', 'DollarSign', 5),
  ('equipment', 'Equipamentos', 'Gestão de equipamentos', 'Dumbbell', 6),
  ('shop', 'Loja', 'Vendas e produtos', 'ShoppingBag', 7),
  ('events', 'Eventos', 'Gestão de eventos', 'CalendarDays', 8),
  ('settings', 'Configurações', 'Configurações do sistema', 'Settings', 9);

-- Create roles table (company-specific roles)
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Create role_permissions table (which permissions each role has)
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL REFERENCES public.modules(key) ON DELETE CASCADE,
  action permission_action NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, module_key, action)
);

-- Create staff table (company employees with their roles)
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Create students table (students of each company)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  health_notes TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Modules are readable by all authenticated users
CREATE POLICY "Modules are readable by all" ON public.modules
FOR SELECT TO authenticated USING (true);

-- Roles policies (company-specific)
CREATE POLICY "Users can view roles of their company" ON public.roles
FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage roles of their company" ON public.roles
FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Role permissions policies
CREATE POLICY "Users can view role permissions of their company" ON public.role_permissions
FOR SELECT TO authenticated
USING (role_id IN (
  SELECT id FROM public.roles WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage role permissions of their company" ON public.role_permissions
FOR ALL TO authenticated
USING (role_id IN (
  SELECT id FROM public.roles WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
))
WITH CHECK (role_id IN (
  SELECT id FROM public.roles WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

-- Staff policies
CREATE POLICY "Users can view staff of their company" ON public.staff
FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage staff of their company" ON public.staff
FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Students policies
CREATE POLICY "Users can view students of their company" ON public.students
FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage students of their company" ON public.students
FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default roles for a new company
CREATE OR REPLACE FUNCTION public.create_default_roles_for_company(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role_id UUID;
  v_manager_role_id UUID;
  v_receptionist_role_id UUID;
  v_trainer_role_id UUID;
  v_instructor_role_id UUID;
  v_module RECORD;
BEGIN
  -- Create Admin role (full access)
  INSERT INTO public.roles (company_id, name, description, is_default, is_admin)
  VALUES (p_company_id, 'Administrador', 'Acesso total ao sistema', true, true)
  RETURNING id INTO v_admin_role_id;
  
  -- Create Manager role
  INSERT INTO public.roles (company_id, name, description, is_default)
  VALUES (p_company_id, 'Gerente', 'Gestão geral com algumas restrições', true)
  RETURNING id INTO v_manager_role_id;
  
  -- Create Receptionist role
  INSERT INTO public.roles (company_id, name, description, is_default)
  VALUES (p_company_id, 'Recepcionista', 'Atendimento e cadastros básicos', true)
  RETURNING id INTO v_receptionist_role_id;
  
  -- Create Personal Trainer role
  INSERT INTO public.roles (company_id, name, description, is_default)
  VALUES (p_company_id, 'Personal Trainer', 'Gestão de alunos e treinos', true)
  RETURNING id INTO v_trainer_role_id;
  
  -- Create Instructor role
  INSERT INTO public.roles (company_id, name, description, is_default)
  VALUES (p_company_id, 'Instrutor', 'Aulas e acompanhamento', true)
  RETURNING id INTO v_instructor_role_id;
  
  -- Admin gets ALL permissions on ALL modules
  FOR v_module IN SELECT key FROM public.modules LOOP
    INSERT INTO public.role_permissions (role_id, module_key, action)
    VALUES 
      (v_admin_role_id, v_module.key, 'view'),
      (v_admin_role_id, v_module.key, 'create'),
      (v_admin_role_id, v_module.key, 'edit'),
      (v_admin_role_id, v_module.key, 'delete'),
      (v_admin_role_id, v_module.key, 'export'),
      (v_admin_role_id, v_module.key, 'import');
  END LOOP;
  
  -- Manager: full CRUD on most modules, no settings delete
  FOR v_module IN SELECT key FROM public.modules WHERE key != 'settings' LOOP
    INSERT INTO public.role_permissions (role_id, module_key, action)
    VALUES 
      (v_manager_role_id, v_module.key, 'view'),
      (v_manager_role_id, v_module.key, 'create'),
      (v_manager_role_id, v_module.key, 'edit'),
      (v_manager_role_id, v_module.key, 'delete'),
      (v_manager_role_id, v_module.key, 'export');
  END LOOP;
  INSERT INTO public.role_permissions (role_id, module_key, action)
  VALUES (v_manager_role_id, 'settings', 'view');
  
  -- Receptionist: view/create students, view classes, view communication
  INSERT INTO public.role_permissions (role_id, module_key, action) VALUES
    (v_receptionist_role_id, 'students', 'view'),
    (v_receptionist_role_id, 'students', 'create'),
    (v_receptionist_role_id, 'students', 'edit'),
    (v_receptionist_role_id, 'classes', 'view'),
    (v_receptionist_role_id, 'communication', 'view'),
    (v_receptionist_role_id, 'communication', 'create'),
    (v_receptionist_role_id, 'financial', 'view'),
    (v_receptionist_role_id, 'financial', 'create'),
    (v_receptionist_role_id, 'shop', 'view'),
    (v_receptionist_role_id, 'shop', 'create');
  
  -- Personal Trainer: students and classes
  INSERT INTO public.role_permissions (role_id, module_key, action) VALUES
    (v_trainer_role_id, 'students', 'view'),
    (v_trainer_role_id, 'students', 'edit'),
    (v_trainer_role_id, 'classes', 'view'),
    (v_trainer_role_id, 'classes', 'create'),
    (v_trainer_role_id, 'classes', 'edit'),
    (v_trainer_role_id, 'communication', 'view'),
    (v_trainer_role_id, 'communication', 'create');
  
  -- Instructor: view students, manage classes
  INSERT INTO public.role_permissions (role_id, module_key, action) VALUES
    (v_instructor_role_id, 'students', 'view'),
    (v_instructor_role_id, 'classes', 'view'),
    (v_instructor_role_id, 'classes', 'edit'),
    (v_instructor_role_id, 'communication', 'view');
END;
$$;