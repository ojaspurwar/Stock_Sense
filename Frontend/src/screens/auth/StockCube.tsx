import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { createStockCube, StockCubeEvent, StockCubeInstance } from '../../lib/stockCube';

export interface StockCubeHandle {
  play: (type: StockCubeEvent) => void;
}

export interface StockCubeProps {
  className?: string;
  style?: React.CSSProperties;
}

export const StockCube = forwardRef<StockCubeHandle, StockCubeProps>(
  ({ className = '', style }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cubeRef = useRef<StockCubeInstance | null>(null);
    const [isDesktop, setIsDesktop] = useState(true);

    // Below 768px the sky box is hidden, so don't mount the cube there at all.
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const checkWidth = () => {
        setIsDesktop(window.innerWidth > 768);
      };
      checkWidth();
      window.addEventListener('resize', checkWidth);
      return () => window.removeEventListener('resize', checkWidth);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        play: (type: StockCubeEvent) => {
          cubeRef.current?.play(type);
        },
      }),
      []
    );

    useEffect(() => {
      if (!isDesktop || !canvasRef.current) return;
      const cube = createStockCube(canvasRef.current);
      cubeRef.current = cube;

      return () => {
        cube.destroy();
        cubeRef.current = null;
      };
    }, [isDesktop]);

    if (!isDesktop) return null;

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          ...style,
        }}
      />
    );
  }
);

StockCube.displayName = 'StockCube';
