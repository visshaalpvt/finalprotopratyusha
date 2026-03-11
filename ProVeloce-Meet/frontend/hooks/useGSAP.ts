import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Custom hook for GSAP animations
 * Usage: useGSAP(() => { fadeIn('.element') }, [dependencies])
 */
export const useGSAP = (
  callback: (ctx: gsap.Context) => void | (() => void),
  dependencies: React.DependencyList = []
) => {
  const ctx = useRef<gsap.Context>();

  useEffect(() => {
    ctx.current = gsap.context(() => {
      const cleanup = callback(ctx.current!);
      return cleanup;
    });

    return () => {
      ctx.current?.revert();
    };
  }, dependencies);

  return ctx;
};

/**
 * Hook for element ref animations
 */
export const useGSAPRef = <T extends HTMLElement = HTMLElement>() => {
  const ref = useRef<T>(null);
  return ref;
};

/**
 * Hook for timeline animations
 */
export const useGSAPTimeline = (
  callback: (tl: gsap.core.Timeline, ctx: gsap.Context) => void,
  dependencies: React.DependencyList = []
) => {
  const ctx = useRef<gsap.Context>();
  const timeline = useRef<gsap.core.Timeline>();

  useEffect(() => {
    ctx.current = gsap.context(() => {
      timeline.current = gsap.timeline();
      callback(timeline.current, ctx.current!);
    });

    return () => {
      ctx.current?.revert();
      timeline.current?.kill();
    };
  }, dependencies);

  return { timeline: timeline.current, ctx: ctx.current };
};

