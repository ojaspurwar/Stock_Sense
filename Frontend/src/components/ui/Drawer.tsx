import React, { useState, useEffect, useRef } from 'react';
import { MOTION, isReducedMotion } from '../../theme/motion';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      const reduce = isReducedMotion();
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, reduce ? 1 : MOTION.durDrawerOut); // 270ms exit
    }
  }, [isOpen, isRendered]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    const reduce = isReducedMotion();
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, reduce ? 1 : MOTION.durDrawerOut);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing]);

  if (!isRendered && !isOpen) return null;

  return (
    <>
      <div
        className={`scrim ${isClosing ? 'closing' : ''}`}
        onClick={handleClose}
      />
      <aside className={`drawer-container ${isClosing ? 'closing' : ''}`}>
        <div className="d-head">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <span
            className="x"
            onClick={handleClose}
            role="button"
            tabIndex={0}
            aria-label="Close drawer"
          >
            ✕
          </span>
        </div>
        <div className="d-body">{children}</div>
        {footer && <div className="d-foot">{footer}</div>}
      </aside>
    </>
  );
};
