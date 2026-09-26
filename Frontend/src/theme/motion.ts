/**
 * StockSense Unified Motion Tokens & Helpers
 * All open/close and tab changes use these exact tokens and rules.
 * No other timings or easings are allowed.
 */

export const MOTION = {
  // Easings
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)', // enters, sliding pills
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)', // exits
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)', // A→B moves that stay

  // Durations (ms)
  durXs: 140, // hover, press, colour, dropdown close, tab exit
  durSm: 200, // dropdown open, ALL exits, modal exit, toast exit
  durMd: 320, // tab pill, page/tab content in, modal in, accordion, stepper
  durLg: 420, // drawer in, chart bars

  // Specific motion durations from spec
  durDrawerIn: 420,
  durDrawerOut: 270,
  durScrimIn: 320,
  durScrimOut: 200,
  durModalIn: 320,
  durModalOut: 200,
  durPageIn: 320,
  durPageOut: 160,
  durTabIn: 320,
  durTabOut: 140,
  durTabDelay: 90,
  durToastIn: 320,
  durToastOut: 200,
  toastTimeout: 3500,

  // Shifts (px)
  shiftPage: 16,
  shiftPageExit: 8,
  shiftTab: 24,
  shiftModal: 8,
  shiftDropdown: 4,
  shiftToast: 16,
};

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Stop and cancel an ongoing Web Animation
 */
export function stop(anim: Animation | null | undefined): void {
  if (anim) {
    try {
      anim.cancel();
    } catch {
      // Ignore if already finished or detached
    }
  }
}

/**
 * Animate element entrance with Web Animations API
 */
export function enter(
  el: HTMLElement | null,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions
): Animation | null {
  if (!el || typeof el.animate !== 'function') return null;
  const reduce = isReducedMotion();
  const duration = reduce ? 1 : options.duration ?? MOTION.durMd;
  const easing = options.easing ?? MOTION.easeOut;

  const anim = el.animate(keyframes, {
    ...options,
    duration,
    easing,
    fill: 'forwards',
  });
  return anim;
}

/**
 * Animate element exit with Web Animations API
 */
export function exit(
  el: HTMLElement | null,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions,
  onFinish?: () => void
): Animation | null {
  if (!el || typeof el.animate !== 'function') {
    onFinish?.();
    return null;
  }
  const reduce = isReducedMotion();
  const duration = reduce ? 1 : options.duration ?? MOTION.durSm;
  const easing = options.easing ?? MOTION.easeIn;

  const anim = el.animate(keyframes, {
    ...options,
    duration,
    easing,
    fill: 'forwards',
  });

  anim.onfinish = () => {
    onFinish?.();
  };
  return anim;
}
