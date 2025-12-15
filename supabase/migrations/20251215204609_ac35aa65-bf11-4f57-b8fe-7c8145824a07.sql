-- Add registration_code to companies for the registration link
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS registration_code text UNIQUE DEFAULT gen_random_uuid()::text,
ADD COLUMN IF NOT EXISTS regulations_text text,
ADD COLUMN IF NOT EXISTS terms_text text,
ADD COLUMN IF NOT EXISTS anamnesis_filled_by text DEFAULT 'trainer';

-- Add registration tracking to students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS registration_method text DEFAULT 'company_added',
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS terms_document_id uuid;

-- Create table for signed documents (terms, regulations)
CREATE TABLE IF NOT EXISTS public.signed_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- 'terms' or 'regulations'
  document_content text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signed_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on signed_documents
ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for signed_documents
CREATE POLICY "Users can view signed documents of their company students" 
ON public.signed_documents 
FOR SELECT 
USING (
  company_id IN (
    SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
  OR
  student_id IN (
    SELECT students.id FROM students WHERE students.user_id = auth.uid()
  )
);

CREATE POLICY "Students can create their own signed documents" 
ON public.signed_documents 
FOR INSERT 
WITH CHECK (
  student_id IN (
    SELECT students.id FROM students WHERE students.user_id = auth.uid()
  )
);

-- Allow public read of company registration info (for registration page)
CREATE POLICY "Public can view company registration info" 
ON public.companies 
FOR SELECT 
USING (registration_code IS NOT NULL);