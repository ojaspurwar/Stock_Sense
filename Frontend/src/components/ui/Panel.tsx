import React from 'react';

export interface PanelProps {
  variant?: 'white' | 'grey';
  title?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Panel: React.FC<PanelProps> = ({
  variant = 'white',
  title,
  rightAction,
  className = '',
  children,
  style,
}) => {
  return (
    <div className={`panel ${variant} ${className}`.trim()} style={style}>
      {(title || rightAction) && (
        <div className="panel-head">
          {typeof title === 'string' ? <h3 className="panel-title">{title}</h3> : title}
          {rightAction}
        </div>
      )}
      {children}
    </div>
  );
};
