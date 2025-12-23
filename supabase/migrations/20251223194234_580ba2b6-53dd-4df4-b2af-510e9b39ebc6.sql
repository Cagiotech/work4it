-- Create admin settings table
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Platform info
  platform_name TEXT DEFAULT 'Cagiotech',
  platform_url TEXT DEFAULT 'https://app.cagiotech.com',
  platform_description TEXT,
  default_language TEXT DEFAULT 'pt',
  timezone TEXT DEFAULT 'Europe/Lisbon',
  -- Payment info
  mbway_phone TEXT,
  iban TEXT,
  bank_name TEXT,
  nif TEXT,
  billing_name TEXT,
  billing_address TEXT,
  billing_email TEXT,
  -- Email settings
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT,
  smtp_password TEXT,
  from_email TEXT,
  from_name TEXT DEFAULT 'Cagiotech',
  -- Security settings
  require_2fa BOOLEAN DEFAULT true,
  lockout_enabled BOOLEAN DEFAULT true,
  lockout_attempts INTEGER DEFAULT 5,
  session_expiry TEXT DEFAULT '24h',
  -- Feature toggles
  maintenance_mode BOOLEAN DEFAULT false,
  allow_registration BOOLEAN DEFAULT true,
  api_enabled BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 1000,
  -- Notification settings
  notify_new_companies BOOLEAN DEFAULT true,
  notify_pending_payments BOOLEAN DEFAULT true,
  notify_system_errors BOOLEAN DEFAULT true,
  notify_new_suggestions BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admins can view settings" 
ON public.admin_settings 
FOR SELECT 
USING (public.is_admin());

-- Only admins can update settings
CREATE POLICY "Admins can update settings" 
ON public.admin_settings 
FOR UPDATE 
USING (public.is_admin());

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (public.is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.admin_settings (platform_name) VALUES ('Cagiotech');