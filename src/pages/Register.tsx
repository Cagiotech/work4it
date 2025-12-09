import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { DeveloperFooter } from '@/components/DeveloperFooter';
import logo from '@/assets/logo-light.png';
import { Eye, EyeOff, Mail, Lock, Building2, Phone } from 'lucide-react';

const Register = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement register with Supabase
    console.log('Register:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="flex flex-1">
        {/* Left side - Decorative */}
        <div className="relative hidden flex-1 lg:block">
          <div className="absolute inset-0 bg-gradient-primary opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-lg text-center">
              <img src={logo} alt="Cagiotech" className="mx-auto h-24 w-auto brightness-0 invert" />
              <h2 className="mt-8 font-heading text-3xl font-bold text-primary-foreground">
                Comece a Transformar o Seu Negócio
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Junte-se a centenas de empresas que já usam a Cagiotech para gerir os seus espaços fitness.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
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
                {t('auth.registerTitle')}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                  {t('common.login')}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <Label htmlFor="companyName">{t('auth.companyName')}</Label>
                <div className="relative mt-2">
                  <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="A sua empresa"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">{t('common.email')}</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nome@empresa.pt"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+351 900 000 000"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">{t('common.password')}</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
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

              <div>
                <Label htmlFor="confirmPassword">{t('common.confirmPassword')}</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full" size="lg">
                {t('common.register')}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <DeveloperFooter />
    </div>
  );
};

export default Register;
