import React from 'react';

export interface PillProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Pill: React.FC<PillProps> = ({ children, className = '', style }) => {
  return (
    <span className={`pill ${className}`.trim()} style={style}>
      {children}
    </span>
  );
};
