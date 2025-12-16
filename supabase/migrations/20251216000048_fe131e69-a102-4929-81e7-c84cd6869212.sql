-- Drop the old constraint and add new one with all valid statuses
ALTER TABLE public.students DROP CONSTRAINT students_status_check;

ALTER TABLE public.students ADD CONSTRAINT students_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'pending'::text, 'pending_approval'::text, 'rejected'::text]));