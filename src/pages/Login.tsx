import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { DeveloperFooter } from '@/components/DeveloperFooter';
import logo from '@/assets/logo-light.png';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        redirectBasedOnRole(session.user.id);
      } else {
        setCheckingSession(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only redirect on SIGNED_IN event, not on initial state
        if (event === 'SIGNED_IN' && session?.user) {
          redirectBasedOnRole(session.user.id);
        }
        // On sign out, just ensure we stay on login
        if (event === 'SIGNED_OUT') {
          setCheckingSession(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    // Check if user is admin first (highest priority)
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (isAdmin) {
      navigate('/admin');
      return;
    }

    // Check if user is a student
    const { data: student } = await supabase
      .from('students')
      .select('id, registration_method, status, password_changed, terms_accepted_at, company_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (student) {
      if (student.status === 'pending_approval') {
        navigate('/pending-approval');
        return;
      }

      if (student.registration_method === 'self_registered' && student.status === 'pending') {
        navigate('/new-student');
        return;
      }

      navigate('/student');
      return;
    }

    // Check if user is staff (takes priority over profile)
    const { data: staff } = await supabase
      .from('staff')
      .select('id, role_id, company_id, position, password_changed')
      .eq('user_id', userId)
      .maybeSingle();

    if (staff) {
      // Check if password needs to be changed (first login)
      if (staff.password_changed === false) {
        navigate('/onboarding-staff');
        return;
      }

      // Check position for routing (Personal Trainer or Instrutor go to /personal)
      const personalPositions = ['personal trainer', 'instrutor'];
      if (staff.position && personalPositions.includes(staff.position.toLowerCase())) {
        navigate('/personal');
        return;
      }
      
      navigate('/company');
      return;
    }

    // Only check profile if user is not a student or staff (company owner)
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      navigate('/company');
    } else {
      navigate('/onboarding');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error(t('auth.invalidCredentials'));
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        toast.success(t('auth.loginSuccess'));
        await redirectBasedOnRole(data.user.id);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:items-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 rounded-r-[3rem]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 rounded-r-[3rem]" />
        <div className="relative max-w-md text-center animate-fade-in">
          <div className="inline-flex p-5 rounded-3xl bg-white/10 backdrop-blur-sm mb-8">
            <img src={logo} alt="Cagiotech" className="h-20 w-auto brightness-0 invert" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-primary-foreground mb-4">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-10">
            {t('auth.platformDescription')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm">
              <span className="text-3xl font-bold text-primary-foreground">500+</span>
              <span className="text-sm text-primary-foreground/70">{t('common.companies')}</span>
            </div>
            <div className="flex flex-col items-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm">
              <span className="text-3xl font-bold text-primary-foreground">10k+</span>
              <span className="text-sm text-primary-foreground/70">{t('common.athletes')}</span>
            </div>
            <div className="flex flex-col items-center p-5 rounded-2xl bg-white/10 backdrop-blur-sm">
              <span className="text-3xl font-bold text-primary-foreground">99%</span>
              <span className="text-sm text-primary-foreground/70">{t('common.satisfaction')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="p-2.5 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <img src={logo} alt="Cagiotech" className="h-8 w-auto" />
                </div>
                <span className="font-heading text-xl font-bold text-foreground">
                  Cagiotech
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>

            {/* Form */}
            <div className="mb-8">
              <h2 className="font-heading text-3xl font-bold text-foreground">
                {t('auth.loginTitle')}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  {t('common.register')}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium text-sm">
                  {t('common.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.pt"
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-base"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium text-sm">
                  {t('common.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 pr-12 h-14 rounded-2xl bg-muted/30 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-base"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                size="lg" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.loggingIn')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t('common.login')}
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Mobile stats */}
            <div className="mt-10 flex items-center justify-center gap-8 lg:hidden">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-xs text-muted-foreground">{t('common.companies')}</div>
              </div>
              <div className="w-px h-10 bg-border/50 rounded-full" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10k+</div>
                <div className="text-xs text-muted-foreground">{t('common.athletes')}</div>
              </div>
              <div className="w-px h-10 bg-border/50 rounded-full" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99%</div>
                <div className="text-xs text-muted-foreground">{t('common.satisfaction')}</div>
              </div>
            </div>
          </div>
        </div>
        
        <DeveloperFooter />
      </div>
    </div>
  );
};

export default Login;
