import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'white';
  block?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  block = false,
  className = '',
  children,
  ...props
}) => {
  if (variant === 'white') {
    return (
      <button className={`btn-white ${className}`} {...props}>
        {children}
      </button>
    );
  }

  const cls = `btn ${variant} ${block ? 'block' : ''} ${className}`.trim();
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
};
