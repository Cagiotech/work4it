-- Add is_blocked field to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS blocked_reason text,
ADD COLUMN IF NOT EXISTS blocked_by uuid;

-- Create admin_company_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_company_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_details jsonb,
  performed_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_company_logs
ALTER TABLE public.admin_company_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_company_logs
CREATE POLICY "Only admins can view admin company logs"
ON public.admin_company_logs
FOR SELECT
USING (is_admin());

CREATE POLICY "Only admins can insert admin company logs"
ON public.admin_company_logs
FOR INSERT
WITH CHECK (is_admin());

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_company_logs_company_id ON public.admin_company_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_is_blocked ON public.companies(is_blocked);