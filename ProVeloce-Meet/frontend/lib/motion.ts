/**
 * ProVeloce Meet - Motion Configuration
 * 
 * Central source of truth for all animation constants.
 * Cinematic, smooth, and confident motion language.
 * 
 * UPDATED: Cinematic Expansion
 */

// ============================================
// TIMING (in seconds)
// ============================================
export const timing = {
    // Micro-interactions (hover, press)
    instant: 0.1,
    fast: 0.2,      // 200ms

    // Standard UI transitions (modals, panels)
    normal: 0.35,   // 350ms
    slow: 0.42,     // 420ms

    // Cinematic - hero animations, page transitions
    cinematic: 0.8, // 800ms
    hero: 0.92,     // 920ms

    // Character reveal timing
    charReveal: 0.03,  // Per character delay
    wordReveal: 0.08,  // Per word delay
} as const;

// ============================================
// EASING (cubic-bezier curves)
// ============================================
export const easing = {
    // Standard ease-out (fast start, slow end)
    out: [0.25, 0.1, 0.25, 1.0] as const,

    // Material design standard / Smooth
    smooth: [0.4, 0, 0.2, 1] as const,

    // Cinematic ease (slow start, fast middle, slow end)
    cinematic: [0.6, 0.05, 0.01, 0.9] as const,

    // Slight overshoot and settle (for modals, panels)
    bounce: [0.34, 1.56, 0.64, 1] as const,

    // Gentle spring (for magnetic effects)
    spring: {
        type: "spring",
        stiffness: 400,
        damping: 30,
    } as const,

    // Soft spring (for cards)
    softSpring: {
        type: "spring",
        stiffness: 300,
        damping: 30,
    } as const,
} as const;

// ============================================
// STAGGER DELAYS (in seconds)
// ============================================
export const stagger = {
    fast: 0.03,
    normal: 0.06,
    slow: 0.1,
    char: 0.03,
    word: 0.08,
} as const;

// ============================================
// TRANSFORM SCALES
// ============================================
export const scale = {
    pressed: 0.96,
    softPressed: 0.98,
    hover: 1.03,
    softHover: 1.01,
    initial: 0.95,
} as const;

// ============================================
// BLUR VALUES (in pixels)
// ============================================
export const blur = {
    subtle: 4,
    normal: 8,
    backdrop: 12,
} as const;

// ============================================
// VARIANTS
// ============================================

// Coil motion pattern (fade + scale + rotate + y)
export const coilVariants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        rotateX: 10
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        transition: {
            duration: timing.cinematic,
            ease: easing.smooth
        }
    }
};

// 3D Depth Hover
export const depthHoverVariants = {
    initial: {
        scale: 1,
        z: 0,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    },
    hover: {
        scale: 1.02,
        z: 20,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: {
            duration: timing.fast,
            ease: easing.out
        }
    }
};

// ... keep existing variants ...
export const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: timing.normal, ease: easing.smooth }
    }
};

export const scaleInVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: timing.normal, ease: easing.bounce }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: timing.fast, ease: easing.out }
    }
};

export const slideUpVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: timing.normal, ease: easing.smooth }
    },
    exit: {
        opacity: 0,
        y: '100%',
        transition: { duration: timing.normal, ease: easing.out }
    }
};

export const slideInRightVariants = {
    hidden: { opacity: 0, x: '100%' },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: timing.normal, ease: easing.bounce }
    },
    exit: {
        opacity: 0,
        x: '100%',
        transition: { duration: timing.normal, ease: easing.out }
    }
};

export const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: timing.normal } },
    exit: { opacity: 0, transition: { duration: timing.fast } }
};

export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Button hover/press with glow
export const buttonMotionProps = {
    whileHover: {
        scale: 1.03,
        transition: { duration: timing.fast, ease: easing.spring }
    },
    whileTap: {
        scale: scale.softPressed,
        transition: { duration: timing.instant }
    },
};

// Card hover/press states
export const cardMotionProps = {
    whileHover: {
        scale: scale.hover,
        y: -2,
        transition: { duration: timing.fast, ease: easing.out }
    },
    whileTap: {
        scale: scale.pressed,
        transition: { duration: timing.instant, ease: easing.out }
    },
};

// ============================================
// CINEMATIC POLISH VARIANTS
// ============================================

// Page fade-slide-in (first load only)
export const pageEnterVariants = {
    hidden: {
        opacity: 0,
        y: 12,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: timing.normal,
            ease: easing.smooth,
        }
    },
};

// Active speaker glow ring + soft pulse
export const activeSpeakerVariants = {
    inactive: {
        boxShadow: '0 0 0 0 rgba(26, 115, 232, 0)',
        scale: 1,
    },
    active: {
        boxShadow: [
            '0 0 0 0 rgba(26, 115, 232, 0.4)',
            '0 0 0 8px rgba(26, 115, 232, 0.2)',
            '0 0 0 4px rgba(26, 115, 232, 0.3)',
        ],
        scale: 1,
        transition: {
            boxShadow: {
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'reverse' as const,
                ease: 'easeInOut',
            },
        },
    },
};

// Theme fade-dim transition (250ms)
export const themeTransitionVariants = {
    initial: { opacity: 1 },
    switching: {
        opacity: 0.85,
        transition: { duration: 0.125 }
    },
    complete: {
        opacity: 1,
        transition: { duration: 0.125 }
    },
};

// Toolbar slide-in (desktop hover)
export const toolbarVariants = {
    hidden: {
        y: 20,
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: timing.fast,
            ease: easing.out,
        },
    },
    exit: {
        y: 20,
        opacity: 0,
        transition: {
            duration: timing.fast,
            ease: easing.out,
        },
    },
};

// Video tile grid entrance
export const videoTileVariants = {
    hidden: {
        opacity: 0,
        scale: 0.92,
    },
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        transition: {
            duration: timing.normal,
            delay: i * stagger.fast,
            ease: easing.smooth,
        }
    }),
};

// Cursor drift effect for cards (subtle parallax)
export const cursorDriftConfig = {
    maxRotate: 2,      // degrees
    maxTranslate: 3,   // pixels
    perspective: 1000, // pixels
    smooth: 0.1,       // smoothing factor
};

// ============================================
// PERFORMANCE UTILITIES
// ============================================

// Detect low-power mode or mobile
export const isLowPowerDevice = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check for mobile/tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );

    // Check for low hardware concurrency
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

    // Check for battery saver (if API available)
    const batterySaver = 'getBattery' in navigator;

    return isMobile || lowCores || prefersReducedMotion();
};

// Get safe motion props (disables on low-power)
export const getSafeMotionProps = <T extends Record<string, unknown>>(
    props: T
): T | Record<string, never> => {
    if (isLowPowerDevice()) return {};
    return props;
};

// GPU acceleration style
export const gpuAccelerated = {
    transform: 'translate3d(0,0,0)',
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden' as const,
} as const;
