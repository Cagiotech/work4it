import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { DeveloperFooter } from '@/components/DeveloperFooter';
import logo from '@/assets/logo-light.png';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        redirectBasedOnOnboarding(session.user.id);
      }
    };
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          redirectBasedOnOnboarding(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const redirectBasedOnOnboarding = async (userId: string) => {
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
          toast.error('Email ou senha incorretos');
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        toast.success('Login realizado com sucesso!');
        await redirectBasedOnOnboarding(data.user.id);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="flex flex-1">
        {/* Left side - Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="Cagiotech" className="h-10 w-auto" />
                <span className="font-heading text-xl font-bold text-foreground">
                  Cagiotech
                </span>
              </Link>
              <LanguageSwitcher />
            </div>

            <div className="mt-10">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {t('auth.loginTitle')}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="font-medium text-primary hover:text-primary/80">
                  {t('common.register')}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <Label htmlFor="email">{t('common.email')}</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.pt"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">{t('common.password')}</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Entrando...' : t('common.login')}
              </Button>
            </form>
          </div>
        </div>

        {/* Right side - Decorative */}
        <div className="relative hidden flex-1 lg:block">
          <div className="absolute inset-0 bg-gradient-primary opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-lg text-center">
              <img src={logo} alt="Cagiotech" className="mx-auto h-24 w-auto brightness-0 invert" />
              <h2 className="mt-8 font-heading text-3xl font-bold text-primary-foreground">
                Gestão Inteligente para Wellness & Fitness
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                A plataforma completa para gerir o seu negócio de fitness em Portugal.
              </p>
            </div>
          </div>
        </div>
      </div>
      <DeveloperFooter />
    </div>
  );
};

export default Login;
