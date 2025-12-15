-- Add password_changed column to staff table
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS password_changed boolean DEFAULT false;