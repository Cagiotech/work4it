-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents', 
  'student-documents', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Create table for document metadata
CREATE TABLE public.student_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_documents
CREATE POLICY "Users can view documents of their company students"
ON public.student_documents
FOR SELECT
USING (student_id IN (
  SELECT id FROM public.students 
  WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage documents of their company students"
ON public.student_documents
FOR ALL
USING (student_id IN (
  SELECT id FROM public.students 
  WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
))
WITH CHECK (student_id IN (
  SELECT id FROM public.students 
  WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

-- Storage policies
CREATE POLICY "Users can view documents of their students"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'student-documents' AND
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON s.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[1] = s.id::text
  )
);

CREATE POLICY "Users can upload documents for their students"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'student-documents' AND
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON s.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[1] = s.id::text
  )
);

CREATE POLICY "Users can delete documents of their students"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'student-documents' AND
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON s.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[1] = s.id::text
  )
);