-- Create password reset requests table
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('company', 'staff', 'student')),
  user_id UUID,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  new_password TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Admin can view all requests
CREATE POLICY "Admin can view all password reset requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (public.is_admin());

-- Admin can update all requests
CREATE POLICY "Admin can update all password reset requests"
  ON public.password_reset_requests
  FOR UPDATE
  USING (public.is_admin());

-- Company staff can view requests for their company's users
CREATE POLICY "Company staff can view their company requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.user_id = auth.uid()
        AND s.company_id = password_reset_requests.company_id
        AND s.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.company_id = password_reset_requests.company_id
    )
  );

-- Company staff can update requests for their company's users
CREATE POLICY "Company staff can update their company requests"
  ON public.password_reset_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.user_id = auth.uid()
        AND s.company_id = password_reset_requests.company_id
        AND s.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.company_id = password_reset_requests.company_id
    )
  );

-- Anyone can insert a request (public facing)
CREATE POLICY "Anyone can create password reset request"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_password_reset_requests_email ON public.password_reset_requests(email);
CREATE INDEX idx_password_reset_requests_company_id ON public.password_reset_requests(company_id);
CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests(status);