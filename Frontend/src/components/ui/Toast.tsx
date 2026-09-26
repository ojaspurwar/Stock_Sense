import React, { useState, useEffect, useRef } from 'react';
import { MOTION, isReducedMotion } from '../../theme/motion';

export interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onDismiss,
  durationMs = MOTION.toastTimeout, // 3.5s auto-hide
}) => {
  const [isRendered, setIsRendered] = useState(Boolean(message));
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message) {
      setIsRendered(true);
      setIsClosing(false);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

      // Auto-hide after 3.5s
      const timer = setTimeout(() => {
        setIsClosing(true);
        const reduce = isReducedMotion();
        closeTimerRef.current = setTimeout(() => {
          setIsRendered(false);
          setIsClosing(false);
          onDismiss();
        }, reduce ? 1 : MOTION.durToastOut); // 200ms exit
      }, durationMs);

      return () => clearTimeout(timer);
    } else if (isRendered) {
      setIsClosing(true);
      const reduce = isReducedMotion();
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, reduce ? 1 : MOTION.durToastOut);
    }
  }, [message, durationMs, onDismiss, isRendered]);

  if (!isRendered && !message) return null;

  return (
    <div
      className={`toast-wrapper ${isClosing ? 'closing' : ''}`}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      <div className="toast" style={{ pointerEvents: 'auto' }}>
        <i></i>
        <span>{message}</span>
      </div>
    </div>
  );
};
