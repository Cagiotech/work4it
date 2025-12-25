-- Add trial fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '14 days'),
ADD COLUMN IF NOT EXISTS has_active_subscription boolean DEFAULT false;

-- Update existing companies to have trial already expired (they need to subscribe)
UPDATE public.companies 
SET trial_started_at = created_at,
    trial_ends_at = created_at + interval '14 days'
WHERE trial_started_at IS NULL;