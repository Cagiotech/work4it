-- Add payment_method column to financial_transactions
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';

-- Add comment for the column
COMMENT ON COLUMN public.financial_transactions.payment_method IS 'Payment method: cash, card, transfer, mbway, multibanco, check, other';