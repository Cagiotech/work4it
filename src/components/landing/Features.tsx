import { useTranslation } from 'react-i18next';
import { Users, Calendar, DollarSign, UserCog } from 'lucide-react';

const features = [
  { key: 'students', icon: Users },
  { key: 'classes', icon: Calendar },
  { key: 'financial', icon: DollarSign },
  { key: 'team', icon: UserCog },
];

export function Features() {
  const { t } = useTranslation();

  return (
    <section className="py-20 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.features.title')}
          </h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="group relative rounded-2xl bg-card p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl font-semibold">
                  {t(`landing.features.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {t(`landing.features.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
