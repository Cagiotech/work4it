-- Table for staff work schedules (carga horária)
CREATE TABLE public.staff_work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  is_working_day BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, day_of_week)
);

-- Table for vacation/leave balances
CREATE TABLE public.staff_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  vacation_days_entitled INTEGER DEFAULT 22,
  vacation_days_used INTEGER DEFAULT 0,
  sick_days_used INTEGER DEFAULT 0,
  personal_days_entitled INTEGER DEFAULT 2,
  personal_days_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, year)
);

-- Enable RLS
ALTER TABLE public.staff_work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work schedules
CREATE POLICY "Users can view work schedules of their company"
ON public.staff_work_schedules FOR SELECT
USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can manage work schedules of their company"
ON public.staff_work_schedules FOR ALL
USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for leave balances
CREATE POLICY "Users can view leave balances of their company"
ON public.staff_leave_balances FOR SELECT
USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can manage leave balances of their company"
ON public.staff_leave_balances FOR ALL
USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Add weekly_hours to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 40;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'full_time';