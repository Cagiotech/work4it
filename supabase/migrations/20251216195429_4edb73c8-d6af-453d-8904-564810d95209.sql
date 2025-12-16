-- Add color column to roles table
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS color text DEFAULT '#aeca12';