import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { DeveloperFooter } from '@/components/DeveloperFooter';
import logo from '@/assets/logo-light.png';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwordsNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error(t('auth.emailAlreadyRegistered'));
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        toast.success(t('auth.accountCreated'));
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error(error.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    t('auth.benefits.management'),
    t('auth.benefits.plans'),
    t('auth.benefits.financial'),
    t('auth.benefits.communication'),
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
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
                {t('auth.registerTitle')}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  {t('common.login')}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium text-sm">
                  {t('common.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
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
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium text-sm">
                  {t('common.confirmPassword')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-base"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all mt-2" 
                size="lg" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.creatingAccount')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t('common.register')}
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Mobile benefits */}
            <div className="mt-8 space-y-3 lg:hidden">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DeveloperFooter />
      </div>

      {/* Right side - Decorative */}
      <div className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:items-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 rounded-l-[3rem]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 rounded-l-[3rem]" />
        <div className="relative max-w-md text-center animate-fade-in">
          <div className="inline-flex p-5 rounded-3xl bg-white/10 backdrop-blur-sm mb-8">
            <img src={logo} alt="Cagiotech" className="h-20 w-auto brightness-0 invert" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-primary-foreground mb-4">
            {t('auth.startTransform')}
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-10">
            {t('auth.joinCompanies')}
          </p>
          
          {/* Benefits list */}
          <div className="space-y-4 text-left">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-primary-foreground font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
