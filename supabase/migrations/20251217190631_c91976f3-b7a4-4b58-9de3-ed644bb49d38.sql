-- Add billing frequency and payment blocking settings to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS billing_frequency text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS penalty_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS block_after_days integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grace_period_days integer DEFAULT 3;

-- Add MB Way phone to companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS mbway_phone text DEFAULT NULL;

-- Create payment proofs table for students to upload receipts
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.student_subscriptions(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  proof_file_path text NOT NULL,
  proof_file_name text NOT NULL,
  proof_file_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payment_proofs
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Students can view and create their own payment proofs
CREATE POLICY "Students can view their own payment proofs"
ON public.payment_proofs FOR SELECT
USING (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
));

CREATE POLICY "Students can create their own payment proofs"
ON public.payment_proofs FOR INSERT
WITH CHECK (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
));

-- Company users can view and manage payment proofs of their students
CREATE POLICY "Users can view payment proofs of their company students"
ON public.payment_proofs FOR SELECT
USING (student_id IN (
  SELECT id FROM students WHERE company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage payment proofs of their company students"
ON public.payment_proofs FOR ALL
USING (student_id IN (
  SELECT id FROM students WHERE company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
))
WITH CHECK (student_id IN (
  SELECT id FROM students WHERE company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
));

-- Create trigger for updated_at
CREATE TRIGGER update_payment_proofs_updated_at
BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Students can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Company users can view payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN students s ON s.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND s.user_id::text = (storage.foldername(name))[1]
  )
);