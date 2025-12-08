import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div
      className={cn(
        "rounded-2xl bg-card p-6 shadow-md transition-all duration-300 hover:shadow-lg",
        className
      )}
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      
      <div className="font-heading text-3xl font-bold text-foreground">
        {value}
      </div>
      
      <div className="mt-1 text-sm font-medium text-primary">
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
    </div>
  );
}
