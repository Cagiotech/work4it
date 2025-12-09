import { useTranslation } from 'react-i18next';
import { Users, Calendar, DollarSign, UserCog } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { key: 'students', icon: Users },
  { key: 'classes', icon: Calendar },
  { key: 'financial', icon: DollarSign },
  { key: 'team', icon: UserCog },
];

export function Features() {
  const { t } = useTranslation();

  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('landing.features.title')}
          </h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.key}
                className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground">
                    {t(`landing.features.${feature.key}.title`)}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {t(`landing.features.${feature.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
