-- Tabela de planos globais do admin (diferentes dos subscription_plans que são por empresa)
CREATE TABLE public.admin_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
    max_students INTEGER, -- null = unlimited
    max_staff INTEGER, -- null = unlimited
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active admin plans" ON public.admin_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage all admin plans" ON public.admin_plans
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Trigger para updated_at
CREATE TRIGGER update_admin_plans_updated_at
    BEFORE UPDATE ON public.admin_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atualizar company_subscriptions para referenciar admin_plans
ALTER TABLE public.company_subscriptions 
    DROP CONSTRAINT IF EXISTS company_subscriptions_plan_id_fkey;

ALTER TABLE public.company_subscriptions
    ADD CONSTRAINT company_subscriptions_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES public.admin_plans(id);

-- Inserir planos padrão
INSERT INTO public.admin_plans (name, description, price, billing_cycle, max_students, max_staff, features, sort_order) VALUES
('Básico', 'Ideal para pequenos negócios', 29.99, 'monthly', 50, 3, '["Gestão de alunos", "Agendamento básico", "Relatórios simples"]'::jsonb, 1),
('Intermédio', 'Para negócios em crescimento', 59.99, 'monthly', 150, 10, '["Tudo do Básico", "Comunicação avançada", "Equipamentos", "Relatórios avançados"]'::jsonb, 2),
('Premium', 'Para grandes operações', 99.99, 'monthly', NULL, NULL, '["Tudo do Intermédio", "Alunos ilimitados", "Staff ilimitado", "API access", "Suporte prioritário"]'::jsonb, 3);