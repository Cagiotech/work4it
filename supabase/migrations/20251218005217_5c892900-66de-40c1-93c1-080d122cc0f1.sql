-- Create messages table for internal chat system
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('staff', 'student', 'company')),
  receiver_id UUID NOT NULL,
  receiver_type TEXT NOT NULL CHECK (receiver_type IN ('staff', 'student', 'company')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Staff can view messages they sent or received
CREATE POLICY "Staff can view their messages"
ON public.messages
FOR SELECT
USING (
  (sender_type = 'staff' AND sender_id IN (SELECT id FROM staff WHERE user_id = auth.uid()))
  OR
  (receiver_type = 'staff' AND receiver_id IN (SELECT id FROM staff WHERE user_id = auth.uid()))
);

-- Staff can send messages
CREATE POLICY "Staff can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_type = 'staff' AND sender_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

-- Staff can update messages they received (mark as read)
CREATE POLICY "Staff can update messages they received"
ON public.messages
FOR UPDATE
USING (
  receiver_type = 'staff' AND receiver_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

-- Students can view messages they sent or received
CREATE POLICY "Students can view their messages"
ON public.messages
FOR SELECT
USING (
  (sender_type = 'student' AND sender_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
  OR
  (receiver_type = 'student' AND receiver_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
);

-- Students can send messages
CREATE POLICY "Students can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_type = 'student' AND sender_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- Students can update messages they received (mark as read)
CREATE POLICY "Students can update messages they received"
ON public.messages
FOR UPDATE
USING (
  receiver_type = 'student' AND receiver_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- Company users can view all messages in their company
CREATE POLICY "Company users can view company messages"
ON public.messages
FOR SELECT
USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);

-- Company users can send messages
CREATE POLICY "Company users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create training_plans table if not exists
CREATE TABLE IF NOT EXISTS public.training_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.staff(id),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for training_plans
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

-- Staff can manage training plans for their assigned students
CREATE POLICY "Staff can view training plans"
ON public.training_plans
FOR SELECT
USING (
  student_id IN (SELECT id FROM students WHERE personal_trainer_id IN (SELECT id FROM staff WHERE user_id = auth.uid()))
  OR
  student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Staff can manage training plans"
ON public.training_plans
FOR ALL
USING (
  student_id IN (SELECT id FROM students WHERE personal_trainer_id IN (SELECT id FROM staff WHERE user_id = auth.uid()))
  OR
  student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
)
WITH CHECK (
  student_id IN (SELECT id FROM students WHERE personal_trainer_id IN (SELECT id FROM staff WHERE user_id = auth.uid()))
  OR
  student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
);

-- Students can view their own training plans
CREATE POLICY "Students can view their training plans"
ON public.training_plans
FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Create training_exercises table
CREATE TABLE IF NOT EXISTS public.training_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT,
  weight TEXT,
  rest_seconds INTEGER,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for training_exercises
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;

-- Policies for training_exercises inherit from training_plans
CREATE POLICY "Users can view training exercises"
ON public.training_exercises
FOR SELECT
USING (
  plan_id IN (SELECT id FROM training_plans)
);

CREATE POLICY "Staff can manage training exercises"
ON public.training_exercises
FOR ALL
USING (
  plan_id IN (
    SELECT id FROM training_plans WHERE 
    student_id IN (SELECT id FROM students WHERE personal_trainer_id IN (SELECT id FROM staff WHERE user_id = auth.uid()))
    OR
    student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
  )
)
WITH CHECK (
  plan_id IN (
    SELECT id FROM training_plans WHERE 
    student_id IN (SELECT id FROM students WHERE personal_trainer_id IN (SELECT id FROM staff WHERE user_id = auth.uid()))
    OR
    student_id IN (SELECT id FROM students WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
  )
);

-- Create events table for company events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  event_type TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  max_participants INTEGER,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Company users can manage events
CREATE POLICY "Users can view events of their company"
ON public.events
FOR SELECT
USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  OR
  company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid())
  OR
  company_id IN (SELECT company_id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Company users can manage events"
ON public.events
FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));