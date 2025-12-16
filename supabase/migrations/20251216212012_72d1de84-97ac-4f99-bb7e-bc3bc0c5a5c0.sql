-- Create storage bucket for staff documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-documents', 'staff-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for staff documents bucket
CREATE POLICY "Users can view staff documents of their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'staff-documents' AND
  auth.uid() IN (
    SELECT p.user_id FROM profiles p
    JOIN staff s ON s.company_id = p.company_id
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can upload staff documents of their company"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staff-documents' AND
  auth.uid() IN (
    SELECT p.user_id FROM profiles p
    JOIN staff s ON s.company_id = p.company_id
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can update staff documents of their company"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'staff-documents' AND
  auth.uid() IN (
    SELECT p.user_id FROM profiles p
    JOIN staff s ON s.company_id = p.company_id
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete staff documents of their company"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'staff-documents' AND
  auth.uid() IN (
    SELECT p.user_id FROM profiles p
    JOIN staff s ON s.company_id = p.company_id
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);