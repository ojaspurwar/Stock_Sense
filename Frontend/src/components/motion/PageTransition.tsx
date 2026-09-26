import React, { useState, useEffect, useRef } from 'react';
import { MOTION, isReducedMotion, stop, enter, exit } from '../../theme/motion';

export const ROUTE_ORDER: Record<string, number> = {
  dashboard: 0,
  products: 1,
  receipts: 2,
  deliveries: 3,
  transfers: 4,
  adjustments: 5,
  ledger: 6,
  warehouses: 7,
  profile: 8,
  'ui-kit': 9,
};

export interface PageTransitionProps {
  currentRoute: string;
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ currentRoute, children }) => {
  const [displayedRoute, setDisplayedRoute] = useState(currentRoute);
  const [displayedChildren, setDisplayedChildren] = useState(children);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeAnimRef = useRef<Animation | null>(null);
  const prevRouteRef = useRef(currentRoute);
  const latestRouteRef = useRef(currentRoute);
  const latestChildrenRef = useRef(children);

  latestRouteRef.current = currentRoute;
  latestChildrenRef.current = children;

  useEffect(() => {
    // If the route hasn't changed, just update children (e.g. data updates within same page)
    if (currentRoute === displayedRoute) {
      setDisplayedChildren(children);
      prevRouteRef.current = currentRoute;
      return;
    }

    const prevIndex = ROUTE_ORDER[prevRouteRef.current] ?? 0;
    const nextIndex = ROUTE_ORDER[currentRoute] ?? 0;
    const isDownward = nextIndex >= prevIndex;
    const reduce = isReducedMotion();

    const exitY = reduce ? 0 : isDownward ? -MOTION.shiftPageExit : MOTION.shiftPageExit;
    const enterY = reduce ? 0 : isDownward ? MOTION.shiftPage : -MOTION.shiftPage;

    // Cancel any ongoing transition immediately
    stop(activeAnimRef.current);
    activeAnimRef.current = null;

    const el = containerRef.current;
    if (!el || reduce) {
      setDisplayedRoute(currentRoute);
      setDisplayedChildren(children);
      prevRouteRef.current = currentRoute;
      return;
    }

    // Step 1: Animate old page out
    const animExit = exit(
      el,
      [
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        { opacity: 0, transform: `translate3d(0, ${exitY}px, 0)` },
      ],
      {
        duration: MOTION.durPageOut,
        easing: MOTION.easeIn,
      },
      () => {
        // Step 2: Swap content to target route
        const targetRoute = latestRouteRef.current;
        const targetChildren = latestChildrenRef.current;
        setDisplayedRoute(targetRoute);
        setDisplayedChildren(targetChildren);
        prevRouteRef.current = targetRoute;

        // Step 3: Animate new page in
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const animEnter = enter(
            containerRef.current,
            [
              { opacity: 0, transform: `translate3d(0, ${enterY}px, 0)` },
              { opacity: 1, transform: 'translate3d(0, 0, 0)' },
            ],
            {
              duration: MOTION.durPageIn,
              easing: MOTION.easeOut,
            }
          );
          activeAnimRef.current = animEnter;
        });
      }
    );

    activeAnimRef.current = animExit;

    return () => {
      stop(activeAnimRef.current);
    };
  }, [currentRoute, children, displayedRoute]);

  return (
    <div
      ref={containerRef}
      className="page-swap-container"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {displayedChildren}
    </div>
  );
};
