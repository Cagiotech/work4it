-- Admin Audit Logs for detailed tracking
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Admin Coupons for discounts
CREATE TABLE IF NOT EXISTS public.admin_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL,
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Admin Communications for mass messaging
CREATE TABLE IF NOT EXISTS public.admin_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'announcement',
  target_audience text DEFAULT 'all',
  sent_at timestamp with time zone,
  scheduled_for timestamp with time zone,
  status text DEFAULT 'draft',
  sent_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- System Alerts for monitoring
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  is_resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Admin Invoices for billing
CREATE TABLE IF NOT EXISTS public.admin_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.company_subscriptions(id),
  invoice_number text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending',
  due_date date,
  paid_at timestamp with time zone,
  payment_method text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add coupon_id to company_subscriptions
ALTER TABLE public.company_subscriptions 
ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.admin_coupons(id);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_audit_logs
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_logs FOR SELECT USING (is_admin());

CREATE POLICY "Only admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT WITH CHECK (is_admin());

-- RLS Policies for admin_coupons
CREATE POLICY "Only admins can manage coupons"
ON public.admin_coupons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for admin_communications
CREATE POLICY "Only admins can manage communications"
ON public.admin_communications FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for system_alerts
CREATE POLICY "Only admins can manage system alerts"
ON public.system_alerts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for admin_invoices
CREATE POLICY "Only admins can manage invoices"
ON public.admin_invoices FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Companies can view their own invoices"
ON public.admin_invoices FOR SELECT USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_invoices_company_id ON public.admin_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_invoices_status ON public.admin_invoices(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_resolved ON public.system_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON public.system_alerts(severity);