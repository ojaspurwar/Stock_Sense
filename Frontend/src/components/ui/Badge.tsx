import React from 'react';

export type BadgeType =
  | 'draft'
  | 'wait'
  | 'ready'
  | 'done'
  | 'cancel'
  | 'low'
  | 'out'
  | 'ok';

interface BadgeProps {
  status?: string | BadgeType;
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status = 'draft', children, className = '' }) => {
  const norm = String(status).toLowerCase();
  let bClass = 'b-draft';
  let label = children || status;

  if (norm.includes('draft')) {
    bClass = 'b-draft';
    label = label || 'Draft';
  } else if (norm.includes('wait')) {
    bClass = 'b-wait';
    label = label || 'Waiting';
  } else if (norm.includes('ready')) {
    bClass = 'b-ready';
    label = label || 'Ready';
  } else if (norm.includes('done') || norm.includes('completed')) {
    bClass = 'b-done';
    label = label || 'Done';
  } else if (norm.includes('cancel')) {
    bClass = 'b-cancel';
    label = label || 'Canceled';
  } else if (norm.includes('low')) {
    bClass = 'b-low';
    label = label || 'Low stock';
  } else if (norm.includes('out')) {
    bClass = 'b-out';
    label = label || 'Out of stock';
  } else if (norm.includes('ok') || norm.includes('in stock')) {
    bClass = 'b-ok';
    label = label || 'In stock';
  }

  return (
    <span className={`badge ${bClass} ${className}`.trim()}>
      <i />
      {label}
    </span>
  );
};
