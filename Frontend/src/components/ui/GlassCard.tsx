import React, { useState, useEffect, useRef } from 'react';

export interface GlassCardSlide {
  title: string;
  description: string;
  meterPercent?: number;
  meterHot?: boolean;
  actionText?: string;
  onAction?: () => void;
}

export interface GlassCardProps {
  slides: GlassCardSlide[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  autoAdvance?: boolean;
  intervalMs?: number;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  slides,
  currentIndex,
  onIndexChange,
  autoAdvance = true,
  intervalMs = 4000,
  className = '',
  style,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const total = slides.length;
  const isControlled = typeof currentIndex === 'number';
  const index = isControlled ? currentIndex : internalIndex;
  const current = slides[index] || slides[0];

  const goNext = () => {
    if (total <= 1) return;
    const next = (index + 1) % total;
    if (!isControlled) setInternalIndex(next);
    onIndexChange?.(next);
  };

  const goPrev = () => {
    if (total <= 1) return;
    const prev = (index - 1 + total) % total;
    if (!isControlled) setInternalIndex(prev);
    onIndexChange?.(prev);
  };

  useEffect(() => {
    if (!autoAdvance || isHovered || total <= 1) return;
    const timer = setInterval(goNext, intervalMs);
    return () => clearInterval(timer);
  }, [autoAdvance, isHovered, total, intervalMs, index, isControlled]);

  useEffect(() => {
    if (cardRef.current && typeof cardRef.current.animate === 'function') {
      cardRef.current.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 300, easing: 'ease-out' }
      );
    }
  }, [index]);

  if (!current) return null;

  return (
    <div
      ref={cardRef}
      className={`glass ${className}`.trim()}
      style={style}
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseLeave?.();
      }}
    >
      <div className="pix" aria-hidden="true">
        <i></i>
        <i></i>
        <i className="off"></i>
        <i></i>
        <i className={current.meterHot ? 'hot' : ''}></i>
        <i></i>
        <i className="off"></i>
        <i></i>
        <i></i>
      </div>
      <h4>{current.title}</h4>
      <p>{current.description}</p>

      {typeof current.meterPercent === 'number' && (
        <div className="meter">
          <i style={{ width: `${Math.min(100, Math.max(0, current.meterPercent))}%` }}></i>
        </div>
      )}

      {current.actionText && (
        <button
          className="reorder"
          onClick={(e) => {
            e.stopPropagation();
            current.onAction?.();
          }}
        >
          {current.actionText}
        </button>
      )}

      <div className="glass-foot">
        <span>
          {index + 1} / {total}
        </span>
        {total > 1 && (
          <div className="arrows">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous"
            >
              ←
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
