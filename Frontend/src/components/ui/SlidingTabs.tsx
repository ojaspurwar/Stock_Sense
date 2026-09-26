import React, { useRef, useState, useEffect } from 'react';

export interface SlidingTabsProps<T extends string> {
  tabs: readonly T[] | T[];
  activeTab: T;
  onChange: (tab: T) => void;
  getLabel?: (tab: T) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SlidingTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  getLabel,
  className = '',
  style,
}: SlidingTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, visible: false });

  const updatePill = () => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector('.tab.on') as HTMLElement | null;
    if (activeEl) {
      setPillStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
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
  }, [activeTab, tabs]);

  return (
    <div
      ref={containerRef}
      className={`tabs ${className}`.trim()}
      style={{ position: 'relative', ...style }}
    >
      {pillStyle.visible && (
        <span
          className="tab-pill"
          style={{
            transform: `translate3d(${pillStyle.left}px, 0, 0)`,
            width: `${pillStyle.width}px`,
          }}
        />
      )}
      {tabs.map((tab) => (
        <span
          key={tab}
          className={`tab ${activeTab === tab ? 'on' : ''}`}
          onClick={() => onChange(tab)}
        >
          {getLabel ? getLabel(tab) : tab}
        </span>
      ))}
    </div>
  );
}
