import React, { useState, useEffect, useRef } from 'react';
import { MOTION, isReducedMotion } from '../../theme/motion';

export interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  style,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      const reduce = isReducedMotion();
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, reduce ? 1 : MOTION.durXs); // 140ms exit duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  // Close on outside click & Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isRendered && !isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`dropdown-menu ${isClosing ? 'closing' : ''} ${className}`.trim()}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};
