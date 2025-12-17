-- Add installment and auto-renewal fields to student_subscriptions
ALTER TABLE public.student_subscriptions
ADD COLUMN IF NOT EXISTS total_installments integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS paid_installments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS installment_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_renewal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS next_payment_date date,
ADD COLUMN IF NOT EXISTS last_payment_date date;

-- Create table to track individual installment payments
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES public.student_subscriptions(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  proof_id uuid REFERENCES public.payment_proofs(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_payments
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Students can view their own subscription payments
CREATE POLICY "Students can view their own subscription payments"
ON public.subscription_payments
FOR SELECT
USING (
  subscription_id IN (
    SELECT ss.id FROM student_subscriptions ss
    JOIN students s ON ss.student_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Company users can manage subscription payments
CREATE POLICY "Users can manage subscription payments of their company"
ON public.subscription_payments
FOR ALL
USING (
  subscription_id IN (
    SELECT ss.id FROM student_subscriptions ss
    JOIN students s ON ss.student_id = s.id
    WHERE s.company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  subscription_id IN (
    SELECT ss.id FROM student_subscriptions ss
    JOIN students s ON ss.student_id = s.id
    WHERE s.company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_payments_updated_at
BEFORE UPDATE ON public.subscription_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();