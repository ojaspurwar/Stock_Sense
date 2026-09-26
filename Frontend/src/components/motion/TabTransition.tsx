import React, { useState, useEffect, useRef } from 'react';
import { MOTION, isReducedMotion, stop, enter, exit } from '../../theme/motion';

export interface TabTransitionProps {
  activeTab: string;
  tabOrder?: string[];
  children: React.ReactNode;
}

export const TabTransition: React.FC<TabTransitionProps> = ({
  activeTab,
  tabOrder = [],
  children,
}) => {
  const [displayedTab, setDisplayedTab] = useState(activeTab);
  const [displayedChildren, setDisplayedChildren] = useState(children);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeAnimRef = useRef<Animation | null>(null);
  const prevTabRef = useRef(activeTab);
  const latestTabRef = useRef(activeTab);
  const latestChildrenRef = useRef(children);

  latestTabRef.current = activeTab;
  latestChildrenRef.current = children;

  useEffect(() => {
    if (activeTab === displayedTab) {
      setDisplayedChildren(children);
      prevTabRef.current = activeTab;
      return;
    }

    const prevIndex = tabOrder.indexOf(prevTabRef.current);
    const nextIndex = tabOrder.indexOf(activeTab);
    const isRightward = nextIndex >= prevIndex;
    const reduce = isReducedMotion();

    const exitX = reduce ? 0 : isRightward ? -MOTION.shiftTab : MOTION.shiftTab;
    const enterX = reduce ? 0 : isRightward ? MOTION.shiftTab : -MOTION.shiftTab;

    stop(activeAnimRef.current);
    activeAnimRef.current = null;

    const el = containerRef.current;
    if (!el || reduce) {
      setDisplayedTab(activeTab);
      setDisplayedChildren(children);
      prevTabRef.current = activeTab;
      return;
    }

    // Step 1: Animate old tab content out (140ms, ease-in)
    const animExit = exit(
      el,
      [
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        { opacity: 0, transform: `translate3d(${exitX}px, 0, 0)` },
      ],
      {
        duration: MOTION.durTabOut,
        easing: MOTION.easeIn,
      },
      () => {
        // Step 2: 90ms delay before new content starts so tables never overlap
        setTimeout(() => {
          const targetTab = latestTabRef.current;
          const targetChildren = latestChildrenRef.current;
          setDisplayedTab(targetTab);
          setDisplayedChildren(targetChildren);
          prevTabRef.current = targetTab;

          // Step 3: Animate new tab content in (320ms, ease-out)
          requestAnimationFrame(() => {
            if (!containerRef.current) return;
            const animEnter = enter(
              containerRef.current,
              [
                { opacity: 0, transform: `translate3d(${enterX}px, 0, 0)` },
                { opacity: 1, transform: 'translate3d(0, 0, 0)' },
              ],
              {
                duration: MOTION.durTabIn,
                easing: MOTION.easeOut,
              }
            );
            activeAnimRef.current = animEnter;
          });
        }, MOTION.durTabDelay);
      }
    );

    activeAnimRef.current = animExit;

    return () => {
      stop(activeAnimRef.current);
    };
  }, [activeTab, children, displayedTab, tabOrder]);

  return (
    <div
      ref={containerRef}
      className="tab-swap-container"
      style={{
        width: '100%',
        position: 'relative',
      }}
    >
      {displayedChildren}
    </div>
  );
};
