-- Add approval requirement setting to companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS require_student_approval BOOLEAN DEFAULT false;

-- Add pending_approval status tracking for students
-- The status column already exists, we just need to ensure 'pending_approval' is a valid status