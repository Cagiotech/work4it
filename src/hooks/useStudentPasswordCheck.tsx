import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useStudentPasswordCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!user?.id) {
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('students')
          .select('password_changed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && data.password_changed === false) {
          setMustChangePassword(true);
          // Redirect to settings if not already there
          if (!location.pathname.includes('/student/settings')) {
            navigate('/student/settings');
          }
        }
      } catch (error) {
        console.error('Error checking password status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkPasswordStatus();
  }, [user?.id, navigate, location.pathname]);

  return { checking, mustChangePassword };
}
