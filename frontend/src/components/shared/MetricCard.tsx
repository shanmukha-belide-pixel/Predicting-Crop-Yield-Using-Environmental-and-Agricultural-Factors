import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import AnimatedCounter from './AnimatedCounter';
import InfoTooltip from './InfoTooltip';

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  icon?: ReactNode;
  info?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  decimals?: number;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  unit = '',
  icon,
  info,
  trend,
  decimals = 0,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("glass-card rounded-xl p-5 flex flex-col", className)}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
          {info && <InfoTooltip content={info} />}
        </div>
        {icon && (
          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary dark:text-primary-light">
            {icon}
          </div>
        )}
      </div>
      
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          <AnimatedCounter value={value} decimals={decimals} />
        </div>
        {unit && (
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {unit}
          </span>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          <span className={cn(
            "font-medium",
            trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
