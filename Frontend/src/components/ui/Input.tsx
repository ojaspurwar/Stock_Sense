import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: React.ReactNode;
  optional?: boolean;
  hasChevron?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  suffix,
  optional,
  hasChevron,
  className = '',
  ...props
}) => {
  return (
    <div className="field">
      {label && (
        <label>
          {label} {optional && <span className="opt">(Optional)</span>}
        </label>
      )}
      <div className={`input ${className}`}>
        <input {...props} />
        {suffix && <span className="suffix">{suffix}</span>}
        {hasChevron && (
          <svg className="chev" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </div>
    </div>
  );
};
