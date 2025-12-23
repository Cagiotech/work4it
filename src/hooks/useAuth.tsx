import { createContext, useContext, useEffect, useState, type ReactNode, type Context } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role_position: string | null;
  company_id: string | null;
  onboarding_completed: boolean;
}

interface Company {
  id: string;
  name: string | null;
  address: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Prevent dev/HMR from recreating the context (provider/consumer mismatch)
const globalForAuth = globalThis as unknown as {
  __cagiotech_auth_context__?: Context<AuthContextType | undefined>;
};

const AuthContext: Context<AuthContextType | undefined> = import.meta.env.DEV
  ? (globalForAuth.__cagiotech_auth_context__ ??
      (globalForAuth.__cagiotech_auth_context__ =
        createContext<AuthContextType | undefined>(undefined)))
  : createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);

        if (profileData.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('id, name, address')
            .eq('id', profileData.company_id)
            .maybeSingle();

          if (companyData) {
            setCompany(companyData as Company);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setCompany(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Use local sign out to always clear client session even if the server session was already revoked.
    // This prevents "Session not found" loops and ensures the app doesn't auto-login again.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore signOut errors; we still clear local state.
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, company, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route wrapper
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (!profile?.onboarding_completed) {
        navigate('/onboarding');
      }
    }
  }, [user, profile, loading, navigate]);

// Loading is now handled by LoadingScreen wrapper in layouts

  if (!user || !profile?.onboarding_completed) {
    return null;
  }

  return <>{children}</>;
}
