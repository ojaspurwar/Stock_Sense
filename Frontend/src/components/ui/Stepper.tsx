import React from 'react';

export interface StepItem {
  number: number;
  label: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 1-indexed
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className = '' }) => {
  const progressPercent =
    steps.length > 1
      ? Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))
      : 100;

  return (
    <div
      className={`stepper ${className}`.trim()}
      style={{ position: 'relative' }}
    >
      <div
        className="stepper-track"
        style={{
          position: 'absolute',
          top: '50%',
          left: 20,
          right: 20,
          height: 2,
          background: 'var(--grey-200)',
          transform: 'translateY(-50%)',
          zIndex: 0,
        }}
      >
        <div
          className="stepper-progress"
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'var(--ink)',
            transition: 'width var(--dur-md) var(--ease-out)',
          }}
        />
      </div>

      {steps.map((st) => {
        const isDone = st.number < currentStep;
        const isNow = st.number === currentStep;
        const cls = isDone ? 'st done' : isNow ? 'st now' : 'st';

        return (
          <div
            key={st.number}
            className={cls}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <b>{st.number}</b>
            {st.label} {isDone && '✓'}
          </div>
        );
      })}
    </div>
  );
};
