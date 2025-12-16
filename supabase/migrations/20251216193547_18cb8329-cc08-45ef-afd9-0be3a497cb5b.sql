-- Staff payment configuration
CREATE TABLE public.staff_payment_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  payment_type text NOT NULL DEFAULT 'monthly', -- monthly, hourly, daily, per_class, commission
  base_salary numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  daily_rate numeric DEFAULT 0,
  per_class_rate numeric DEFAULT 0,
  commission_percentage numeric DEFAULT 0,
  bank_name text,
  bank_iban text,
  nif text,
  niss text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_id)
);

-- Time tracking records
CREATE TABLE public.staff_time_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  clock_in timestamp with time zone NOT NULL,
  clock_out timestamp with time zone,
  break_start timestamp with time zone,
  break_end timestamp with time zone,
  break_duration_minutes integer DEFAULT 0,
  total_hours numeric,
  overtime_hours numeric DEFAULT 0,
  notes text,
  status text DEFAULT 'active', -- active, completed, edited
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Staff absences (vacations, sick leave, etc)
CREATE TABLE public.staff_absences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  absence_type text NOT NULL, -- vacation, sick_leave, personal, unpaid, maternity, paternity
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  status text DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by uuid REFERENCES public.staff(id),
  approved_at timestamp with time zone,
  reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Performance evaluations
CREATE TABLE public.staff_evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES public.staff(id),
  evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
  evaluation_period text, -- Q1 2024, Annual 2024, etc
  overall_score numeric, -- 1-5 or 1-10
  punctuality_score numeric,
  teamwork_score numeric,
  technical_score numeric,
  communication_score numeric,
  initiative_score numeric,
  strengths text,
  areas_to_improve text,
  goals text,
  feedback text,
  status text DEFAULT 'draft', -- draft, submitted, reviewed
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Staff documents
CREATE TABLE public.staff_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- contract, id_card, certification, cv, medical, other
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  description text,
  expiry_date date,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Staff trainings/certifications
CREATE TABLE public.staff_trainings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  training_name text NOT NULL,
  institution text,
  certification_number text,
  start_date date,
  completion_date date,
  expiry_date date,
  status text DEFAULT 'completed', -- in_progress, completed, expired
  hours integer,
  cost numeric DEFAULT 0,
  notes text,
  document_id uuid REFERENCES public.staff_documents(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.staff_payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_trainings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_payment_config
CREATE POLICY "Users can view payment config of their company staff"
ON public.staff_payment_config FOR SELECT
USING (staff_id IN (SELECT id FROM public.staff WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage payment config of their company staff"
ON public.staff_payment_config FOR ALL
USING (staff_id IN (SELECT id FROM public.staff WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())))
WITH CHECK (staff_id IN (SELECT id FROM public.staff WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())));

-- RLS Policies for staff_time_records
CREATE POLICY "Users can view time records of their company"
ON public.staff_time_records FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage time records of their company"
ON public.staff_time_records FOR ALL
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for staff_absences
CREATE POLICY "Users can view absences of their company"
ON public.staff_absences FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage absences of their company"
ON public.staff_absences FOR ALL
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for staff_evaluations
CREATE POLICY "Users can view evaluations of their company"
ON public.staff_evaluations FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage evaluations of their company"
ON public.staff_evaluations FOR ALL
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for staff_documents
CREATE POLICY "Users can view documents of their company staff"
ON public.staff_documents FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage documents of their company staff"
ON public.staff_documents FOR ALL
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for staff_trainings
CREATE POLICY "Users can view trainings of their company staff"
ON public.staff_trainings FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage trainings of their company staff"
ON public.staff_trainings FOR ALL
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_staff_payment_config_updated_at
BEFORE UPDATE ON public.staff_payment_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_time_records_updated_at
BEFORE UPDATE ON public.staff_time_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_absences_updated_at
BEFORE UPDATE ON public.staff_absences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_evaluations_updated_at
BEFORE UPDATE ON public.staff_evaluations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_trainings_updated_at
BEFORE UPDATE ON public.staff_trainings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();