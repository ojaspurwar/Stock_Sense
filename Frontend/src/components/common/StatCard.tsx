import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  onClick,
  badge,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 text-amber-600 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-700',
          badge: 'bg-amber-100 text-amber-800',
        };
      case 'danger':
        return {
          bg: 'bg-rose-500/10 text-rose-600 border-rose-200',
          iconBg: 'bg-rose-100 text-rose-700',
          badge: 'bg-rose-100 text-rose-800',
        };
      case 'info':
        return {
          bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
          iconBg: 'bg-indigo-100 text-indigo-700',
          badge: 'bg-indigo-100 text-indigo-800',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700',
          badge: 'bg-slate-100 text-slate-800',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </h3>
        {badge && (
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles.badge}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
