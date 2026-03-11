'use client';

import { ReactNode, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageEnterVariants, prefersReducedMotion } from '@/lib/motion';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

/**
 * PageTransition - Applies fade-slide-in animation on first load only
 * Respects prefers-reduced-motion
 */
const PageTransition = memo(function PageTransition({
    children,
    className
}: PageTransitionProps) {
    const [hasLoaded, setHasLoaded] = useState(false);
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    useEffect(() => {
        // Mark as loaded after first render
        setHasLoaded(true);
    }, []);

    // Skip animation if already loaded or reduced motion
    if (hasLoaded || reducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            variants={pageEnterVariants}
            initial="hidden"
            animate="visible"
            className={className}
            style={{
                transform: 'translate3d(0,0,0)', // GPU acceleration
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </motion.div>
    );
});

export default PageTransition;
