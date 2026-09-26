import React, { useState, useEffect, useRef } from 'react';

export interface SegmentedControlProps<T extends string> {
  options: readonly T[] | T[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  style,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, visible: false });

  const updatePill = () => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector('button.on') as HTMLButtonElement | null;
    if (activeBtn) {
      setPillStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        visible: true,
      });
    }
  };

  useEffect(() => {
    updatePill();
    const t = setTimeout(updatePill, 30);
    window.addEventListener('resize', updatePill);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updatePill);
    };
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={`segmented ${className}`.trim()}
      style={{ position: 'relative', ...style }}
    >
      {pillStyle.visible && (
        <span
          className="seg-pill"
          style={{
            transform: `translate3d(${pillStyle.left}px, 0, 0)`,
            width: `${pillStyle.width}px`,
          }}
        />
      )}
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={value === opt ? 'on' : ''}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
