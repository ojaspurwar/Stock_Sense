import React from 'react';
import { DocumentStatus } from '../../types';

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStyles = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'WAITING':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'READY':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'DONE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'CANCELED':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-400';
      case 'WAITING':
        return 'bg-amber-500 animate-pulse';
      case 'READY':
        return 'bg-blue-500';
      case 'DONE':
        return 'bg-emerald-500';
      case 'CANCELED':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase ${getStyles()} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor()}`}></span>
      {status}
    </span>
  );
};
