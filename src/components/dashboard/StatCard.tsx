import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="font-heading text-3xl font-bold text-foreground">
          {value}
        </div>
        
        <div className="mt-1 text-sm font-medium text-muted-foreground">
          {title}
        </div>
        
        {subtitle && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}

        {trend && trendValue && (
          <div className={cn(
            "mt-2 text-xs font-medium",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
            trend === 'neutral' && "text-muted-foreground"
          )}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {' '}{trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
