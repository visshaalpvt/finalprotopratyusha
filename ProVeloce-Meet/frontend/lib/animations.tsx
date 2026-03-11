'use client';

import { motion, useInView, MotionProps } from 'framer-motion';
import { useRef, ReactNode } from 'react';

/**
 * Scroll animation variants for consistent animations
 */
export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

export const zoomIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

/**
 * Scroll-triggered animation wrapper component
 */
interface ScrollAnimationProps {
  children: ReactNode;
  variant?: 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'zoomIn';
  className?: string;
  delay?: number;
  once?: boolean;
}

export const ScrollAnimation = ({ 
  children, 
  variant = 'fadeUp', 
  className = '',
  delay = 0,
  once = true 
}: ScrollAnimationProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-50px' });

  const variants = {
    fadeUp: fadeInUp,
    fadeLeft: fadeInLeft,
    fadeRight: fadeInRight,
    zoomIn: zoomIn,
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants[variant]}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger animation container for lists
 */
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export const StaggerContainer = ({ children, className = '' }: StaggerContainerProps) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Meeting screen specific animations
 */
export const meetingAnimations = {
  videoTile: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  controls: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  panelSlide: {
    initial: { opacity: 0, x: 300 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 300 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

