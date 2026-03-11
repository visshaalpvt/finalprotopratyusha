'use client';

import { useRef, useState, MouseEvent, ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';
import { timing, easing, prefersReducedMotion } from '@/lib/motion';

interface SpotlightCardProps {
    children: ReactNode;
    className?: string;
    spotlightColor?: string;
    onClick?: () => void;
}

/**
 * SpotlightCard - Card with cursor-tracking glow effect and 3D tilt
 */
export const SpotlightCard = ({
    children,
    className,
    spotlightColor = "rgba(26, 115, 232, 0.15)",
    onClick,
}: SpotlightCardProps) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        if (reducedMotion) return;
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            className={cn(
                "group relative border border-border-lighter bg-white overflow-hidden rounded-xl",
                className
            )}
            onMouseMove={handleMouseMove}
            onClick={onClick}
            whileHover={!reducedMotion ? {
                scale: 1.01,
                y: -4,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            } : undefined}
            whileTap={!reducedMotion ? { scale: 0.98 } : undefined}
            transition={{ duration: timing.fast, ease: easing.out }}
        >
            {/* Spotlight Gradient */}
            {!reducedMotion && (
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                        background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                ${spotlightColor},
                transparent 80%
              )
            `,
                    }}
                />
            )}

            {/* Content */}
            <div className="relative h-full">
                {children}
            </div>
        </motion.div>
    );
};

interface MagneticWrapperProps {
    children: ReactNode;
    className?: string;
    strength?: number;
}

/**
 * MagneticWrapper - Element that magnetically pulls towards cursor
 */
export const MagneticWrapper = ({
    children,
    className,
    strength = 0.5,
}: MagneticWrapperProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    const handleMouseMove = (e: MouseEvent) => {
        if (reducedMotion) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current!.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * strength, y: middleY * strength });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            ref={ref}
            className={cn("relative", className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={reset}
            animate={reducedMotion ? {} : { x: position.x, y: position.y }}
            transition={reducedMotion ? {} : easing.spring}
        >
            {children}
        </motion.div>
    );
};
