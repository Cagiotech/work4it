-- Create or replace the trigger function to also create a completed profile for admin
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is admin@cagiotech.com, create a profile with onboarding completed
  IF NEW.email = 'admin@cagiotech.com' THEN
    INSERT INTO public.profiles (user_id, full_name, onboarding_completed)
    VALUES (NEW.id, 'Administrador', true)
    ON CONFLICT (user_id) DO UPDATE SET onboarding_completed = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for admin profile creation (runs before the role assignment)
DROP TRIGGER IF EXISTS on_auth_user_created_admin_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_signup();