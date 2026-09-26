import React, { useState, useEffect, useRef } from 'react';
import { MOTION, isReducedMotion } from '../../theme/motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number | string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 520,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const triggerElRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Remember active element that triggered the modal
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        triggerElRef.current = document.activeElement;
      }
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
        // Return focus to the button that opened it
        triggerElRef.current?.focus?.();
      }, reduce ? 1 : MOTION.durModalOut); // 200ms exit
    }
  }, [isOpen, isRendered]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    const reduce = isReducedMotion();
    closeTimerRef.current = setTimeout(() => {
      onClose();
      triggerElRef.current?.focus?.();
    }, reduce ? 1 : MOTION.durModalOut);
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
    <div
      className={`scrim ${isClosing ? 'closing' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={handleClose}
    >
      <div
        className={`modal ${isClosing ? 'closing' : ''}`}
        style={{ width: '100%', maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="doc-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <span
            className="x"
            onClick={handleClose}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          >
            ✕
          </span>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="foot">{footer}</div>}
      </div>
    </div>
  );
};
