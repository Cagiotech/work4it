import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StaffCheckResult {
  checking: boolean;
  mustChangePassword: boolean;
  staff: any | null;
  company: any | null;
  paymentConfig: any | null;
}

export function useStaffAccessCheck(): StaffCheckResult {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [staff, setStaff] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  useEffect(() => {
    const checkStaffStatus = async () => {
      if (!user?.id) {
        setChecking(false);
        return;
      }

      try {
        // Fetch staff data with company
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*, companies(id, name, address), roles(id, name, color)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (staffError) throw staffError;
        
        if (!staffData) {
          // Not a staff member
          setChecking(false);
          return;
        }

        setStaff(staffData);
        setCompany(staffData.companies);

        // Fetch payment config
        const { data: paymentData } = await supabase
          .from('staff_payment_config')
          .select('*')
          .eq('staff_id', staffData.id)
          .maybeSingle();

        if (paymentData) {
          setPaymentConfig(paymentData);
        }

        // Check if needs to change password
        if (staffData.password_changed === false) {
          setMustChangePassword(true);
          if (!location.pathname.includes('/personal/settings')) {
            navigate('/personal/settings');
          }
        }
      } catch (error) {
        console.error('Error checking staff status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkStaffStatus();
  }, [user?.id, navigate, location.pathname]);

  return { 
    checking, 
    mustChangePassword, 
    staff,
    company,
    paymentConfig,
  };
}
