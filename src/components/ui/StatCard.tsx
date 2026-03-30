import type { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'purple';
  children?: ReactNode;
}

export function StatCard({ icon: Icon, label, value, trend, trendUp, color = 'blue' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">
        <Icon size={24} />
      </div>
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
        {trend && (
          <span className={`stat-card__trend ${trendUp ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
