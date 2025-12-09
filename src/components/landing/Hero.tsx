import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="animate-slide-up font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-foreground">{t('landing.hero.title').split('&')[0]}</span>
            <span className="text-gradient">&amp; Fitness</span>
          </h1>
          
          <p className="mt-6 animate-slide-up text-lg text-muted-foreground sm:text-xl [animation-delay:100ms]">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row [animation-delay:200ms] animate-slide-up">
            <Link to="/register">
              <Button variant="hero" size="xl" className="group">
                {t('landing.hero.cta')}
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="outline" size="xl" className="border-foreground/20 text-foreground hover:bg-foreground/5">
              <Play className="h-5 w-5" />
              {t('landing.hero.demo')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4 animate-fade-in [animation-delay:400ms]">
          {[
            { value: '500+', label: 'Empresas' },
            { value: '10k+', label: 'Alunos' },
            { value: '50k+', label: 'Aulas' },
            { value: '99%', label: 'Satisfação' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
