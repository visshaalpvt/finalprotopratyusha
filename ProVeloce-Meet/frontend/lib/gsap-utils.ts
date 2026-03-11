import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * GSAP Animation Utilities for Google Meet/Zoom style animations
 */

// Type for GSAP target (string selector, Element, or array of Elements)
// Note: GSAP's TweenTarget doesn't include null/undefined
type GSAPTarget = string | Element | Element[];

// Fade in animation
export const fadeIn = (element: GSAPTarget, options?: gsap.TweenVars) => {
  return gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
      ...options,
    }
  );
};

// Fade in up animation
export const fadeInUp = (element: GSAPTarget, options?: gsap.TweenVars) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out',
      ...options,
    }
  );
};

// Fade in down animation
export const fadeInDown = (element: GSAPTarget, options?: gsap.TweenVars) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: -30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out',
      ...options,
    }
  );
};

// Slide in from left
export const slideInLeft = (element: GSAPTarget, options?: gsap.TweenVars) => {
  return gsap.fromTo(
    element,
    { opacity: 0, x: -50 },
    {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: 'power3.out',
      ...options,
    }
  );
};

// Slide in from right
export const slideInRight = (element: GSAPTarget, options?: gsap.TweenVars) => {
  return gsap.fromTo(
    element,
    { opacity: 0, x: 50 },
    {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: 'power3.out',
      ...options,
    }
  );
};

// Scale in animation
export const scaleIn = (element: GSAPTarget, options?: gsap.TweenVars) => {
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.9 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
      ...options,
    }
  );
};

// Stagger animation for multiple elements
export const staggerFadeIn = (
  elements: GSAPTarget,
  staggerAmount: number = 0.1,
  options?: gsap.TweenVars
) => {
  return gsap.fromTo(
    elements,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: staggerAmount,
      ease: 'power2.out',
      ...options,
    }
  );
};

// Button hover animation
export const buttonHover = (element: GSAPTarget) => {
  return gsap.to(element, {
    scale: 1.05,
    duration: 0.2,
    ease: 'power2.out',
  });
};

// Button hover out animation
export const buttonHoverOut = (element: GSAPTarget) => {
  return gsap.to(element, {
    scale: 1,
    duration: 0.2,
    ease: 'power2.out',
  });
};

// Pulse animation
export const pulse = (element: GSAPTarget, options?: gsap.TweenVars) => {
  return gsap.to(element, {
    scale: 1.1,
    duration: 0.5,
    yoyo: true,
    repeat: -1,
    ease: 'power1.inOut',
    ...options,
  });
};

// Smooth reveal animation (Google Meet style)
export const smoothReveal = (element: GSAPTarget, options?: gsap.TweenVars) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 20, filter: 'blur(10px)' },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.6,
      ease: 'power3.out',
      ...options,
    }
  );
};

// Page transition animation
export const pageTransition = (element: GSAPTarget) => {
  return gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.inOut',
    }
  );
};

// Card hover animation
export const cardHover = (element: GSAPTarget) => {
  return gsap.to(element, {
    y: -8,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    duration: 0.3,
    ease: 'power2.out',
  });
};

// Card hover out animation
export const cardHoverOut = (element: GSAPTarget) => {
  return gsap.to(element, {
    y: 0,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    duration: 0.3,
    ease: 'power2.out',
  });
};

// Timeline for complex animations
export const createTimeline = (options?: gsap.TimelineVars) => {
  return gsap.timeline(options);
};

// Scroll-triggered animation
export const scrollReveal = (
  element: GSAPTarget,
  options?: gsap.TweenVars & { trigger?: GSAPTarget }
) => {
  const { trigger, ...tweenOptions } = options || {};
  
  return gsap.fromTo(
    element,
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: trigger || element,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
      ...tweenOptions,
    }
  );
};

