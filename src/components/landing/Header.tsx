import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import logo from '@/assets/logo-light.png';
import { Link } from 'react-router-dom';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Cagiotech" className="h-10 w-auto" />
          <span className="font-heading text-xl font-bold text-foreground">
            Cagiotech
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link to="/login">
            <Button variant="ghost">{t('common.login')}</Button>
          </Link>
          <Link to="/register">
            <Button variant="hero">{t('common.register')}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
