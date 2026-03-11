'use client';

import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { activeSpeakerVariants, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ActiveSpeakerRingProps {
    isActive: boolean;
    children: React.ReactNode;
    className?: string;
}

/**
 * ActiveSpeakerRing - Glow ring + soft pulse for active speaker
 * Used to highlight the currently speaking participant
 */
const ActiveSpeakerRing = memo(forwardRef<HTMLDivElement, ActiveSpeakerRingProps>(
    function ActiveSpeakerRing({ isActive, children, className }, ref) {
        const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

        // Skip animation for reduced motion
        if (reducedMotion) {
            return (
                <div
                    ref={ref}
                    className={cn(
                        "relative rounded-lg overflow-hidden",
                        isActive && "ring-2 ring-google-blue ring-offset-2 ring-offset-meeting",
                        className
                    )}
                >
                    {children}
                </div>
            );
        }

        return (
            <motion.div
                ref={ref}
                variants={activeSpeakerVariants}
                initial="inactive"
                animate={isActive ? "active" : "inactive"}
                className={cn(
                    "relative rounded-lg overflow-hidden",
                    className
                )}
                style={{
                    transform: 'translate3d(0,0,0)',
                    willChange: 'box-shadow',
                }}
            >
                {children}

                {/* Static ring for accessibility */}
                {isActive && (
                    <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                            boxShadow: 'inset 0 0 0 2px rgba(26, 115, 232, 0.6)',
                        }}
                    />
                )}
            </motion.div>
        );
    }
));

export default ActiveSpeakerRing;
