-- Add default commitment period to subscription_plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS default_commitment_months integer DEFAULT 0;

-- Add commitment fields to student_subscriptions
ALTER TABLE public.student_subscriptions
ADD COLUMN IF NOT EXISTS commitment_months integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS commitment_end_date date;

-- Create student-photos bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for student photos - public read
CREATE POLICY "Anyone can view student photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

-- Storage policy for uploading student photos
CREATE POLICY "Company users can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' AND
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE company_id IS NOT NULL
  )
);

-- Storage policy for deleting student photos
CREATE POLICY "Company users can delete student photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos' AND
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE company_id IS NOT NULL
  )
);