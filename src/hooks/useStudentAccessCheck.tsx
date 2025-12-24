import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StudentCheckResult {
  checking: boolean;
  mustChangePassword: boolean;
  mustAcceptTerms: boolean;
  needsOnboarding: boolean;
  pendingApproval: boolean;
  student: any | null;
  company: any | null;
}

export function useStudentAccessCheck(): StudentCheckResult {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [mustAcceptTerms, setMustAcceptTerms] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const checkStudentStatus = async () => {
      if (!user?.id) {
        setChecking(false);
        return;
      }

      try {
        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*, companies(id, name, terms_text, regulations_text, mbway_phone)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (studentError) throw studentError;
        
        if (!studentData) {
          // Not a student, might be other role
          setChecking(false);
          return;
        }

        setStudent(studentData);
        setCompany(studentData.companies);

        // Check registration method and status
        const isSelfRegistered = studentData.registration_method === 'self_registered';
        const isCompanyAdded = studentData.registration_method === 'company_added';
        
        // Check if pending approval
        if (studentData.status === 'pending_approval') {
          setPendingApproval(true);
          if (!location.pathname.includes('/pending-approval')) {
            navigate('/pending-approval');
          }
          setChecking(false);
          return;
        }

        // Self-registered students with pending status need onboarding
        if (isSelfRegistered && studentData.status === 'pending') {
          setNeedsOnboarding(true);
          if (!location.pathname.includes('/new-student')) {
            navigate('/new-student');
          }
          setChecking(false);
          return;
        }

        // Company-added students might need to change password
        if (isCompanyAdded && studentData.password_changed === false) {
          setMustChangePassword(true);
          if (!location.pathname.includes('/student/settings')) {
            navigate('/student/settings');
          }
        }

        // All students need to accept terms on first access
        if (!studentData.terms_accepted_at) {
          setMustAcceptTerms(true);
        }
      } catch (error) {
        console.error('Error checking student status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkStudentStatus();
  }, [user?.id, navigate, location.pathname]);

  return { 
    checking, 
    mustChangePassword, 
    mustAcceptTerms, 
    needsOnboarding,
    pendingApproval,
    student,
    company,
  };
}
