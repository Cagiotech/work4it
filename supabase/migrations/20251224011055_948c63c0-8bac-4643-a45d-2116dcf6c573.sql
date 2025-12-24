-- Add block_reason column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS block_reason text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone DEFAULT NULL;