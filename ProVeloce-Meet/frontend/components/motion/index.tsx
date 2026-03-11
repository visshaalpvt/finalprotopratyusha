'use client';

import { memo, forwardRef, ReactNode } from 'react';
import { motion, AnimatePresence, HTMLMotionProps, Variants } from 'framer-motion';
import {
    timing,
    easing,
    stagger,
    scale,
    fadeUpVariants,
    scaleInVariants,
    slideUpVariants,
    slideInRightVariants,
    backdropVariants,
    cardMotionProps,
    buttonMotionProps,
    prefersReducedMotion,
} from '@/lib/motion';
import { cn } from '@/lib/utils';

// Re-export TextReveal components
export { default as TextReveal, HeroTitle, TaglineReveal } from './TextReveal';

// ============================================
// MOTION CARD
// ============================================

interface MotionCardProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
    delay?: number;
}

/**
 * MotionCard - Card with hover lift and press shrink
 */
export const MotionCard = memo(forwardRef<HTMLDivElement, MotionCardProps>(
    function MotionCard({
        children,
        className,
        hoverEffect = true,
        delay = 0,
        ...props
    }, ref) {
        const reducedMotion = prefersReducedMotion();

        return (
            <motion.div
                ref={ref}
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ delay }}
                {...(hoverEffect && !reducedMotion ? cardMotionProps : {})}
                className={cn('relative', className)}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
));

// ============================================
// MOTION LIST
// ============================================

interface MotionListProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    initialDelay?: number;
}

const listContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: stagger.normal,
            delayChildren: 0.1,
        },
    },
};

/**
 * MotionList - Staggered entrance for list items
 */
export const MotionList = memo(function MotionList({
    children,
    className,
    staggerDelay = stagger.normal,
    initialDelay = 0.1,
}: MotionListProps) {
    const reducedMotion = prefersReducedMotion();

    const containerVariants: Variants = {
        hidden: { opacity: reducedMotion ? 1 : 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: reducedMotion ? 0 : staggerDelay,
                delayChildren: reducedMotion ? 0 : initialDelay,
            },
        },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={className}
        >
            {children}
        </motion.div>
    );
});

/**
 * MotionListItem - Individual list item with fade-up
 */
export const MotionListItem = memo(function MotionListItem({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={fadeUpVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
});

// ============================================
// MOTION BUTTON
// ============================================

interface MotionButtonProps extends HTMLMotionProps<'button'> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    withGlow?: boolean;
}

/**
 * MotionButton - Button with magnetic hover and glow pulse
 */
export const MotionButton = memo(forwardRef<HTMLButtonElement, MotionButtonProps>(
    function MotionButton({
        children,
        className,
        variant = 'primary',
        withGlow = false,
        ...props
    }, ref) {
        const reducedMotion = prefersReducedMotion();

        return (
            <motion.button
                ref={ref}
                {...(!reducedMotion ? buttonMotionProps : {})}
                className={cn(
                    'relative touch-target transition-shadow',
                    withGlow && 'hover:shadow-[0_0_30px_rgba(26,115,232,0.3)]',
                    className
                )}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
));

// ============================================
// MOTION MODAL
// ============================================

interface MotionModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    overlayClassName?: string;
    withBlur?: boolean;
}

/**
 * MotionModal - Modal with backdrop blur and scale-in animation
 */
export const MotionModal = memo(function MotionModal({
    isOpen,
    onClose,
    children,
    className,
    overlayClassName,
    withBlur = true,
}: MotionModalProps) {
    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="modal-backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className={cn(
                            'fixed inset-0 z-50 bg-black/50',
                            withBlur && 'backdrop-blur-sm',
                            overlayClassName
                        )}
                    />

                    {/* Modal Content */}
                    <motion.div
                        key="modal-content"
                        variants={scaleInVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                            className
                        )}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

// ============================================
// MOTION BOTTOM SHEET
// ============================================

interface MotionBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
}

/**
 * MotionBottomSheet - Mobile-friendly bottom sheet with slide-up
 */
export const MotionBottomSheet = memo(function MotionBottomSheet({
    isOpen,
    onClose,
    children,
    className,
}: MotionBottomSheetProps) {
    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="sheet-backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        key="sheet-content"
                        variants={slideUpVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                            'fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white',
                            className
                        )}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center py-3">
                            <div className="h-1 w-10 rounded-full bg-gray-300" />
                        </div>
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

// ============================================
// MOTION SIDE PANEL
// ============================================

interface MotionSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    position?: 'left' | 'right';
}

/**
 * MotionSidePanel - Slide-in side panel with overshoot
 */
export const MotionSidePanel = memo(function MotionSidePanel({
    isOpen,
    onClose,
    children,
    className,
    position = 'right',
}: MotionSidePanelProps) {
    const slideVariants: Variants = position === 'right' ? slideInRightVariants : {
        hidden: { opacity: 0, x: '-100%' },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: timing.normal, ease: easing.bounce }
        },
        exit: {
            opacity: 0,
            x: '-100%',
            transition: { duration: timing.normal, ease: easing.out }
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="panel-backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/30"
                    />

                    {/* Panel */}
                    <motion.div
                        key="panel-content"
                        variants={slideVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                            'fixed top-0 bottom-0 z-50 overflow-y-auto bg-white shadow-xl',
                            position === 'right' ? 'right-0' : 'left-0',
                            className
                        )}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

// ============================================
// MOTION FADE
// ============================================

interface MotionFadeProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    show?: boolean;
}

/**
 * MotionFade - Simple fade-in animation wrapper
 */
export const MotionFade = memo(function MotionFade({
    children,
    className,
    delay = 0,
    show = true,
}: MotionFadeProps) {
    return (
        <AnimatePresence mode="wait">
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: timing.normal, delay }}
                    className={className}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
});

// ============================================
// MOTION SCALE
// ============================================

/**
 * MotionScale - Scale-in animation wrapper
 */
export const MotionScale = memo(function MotionScale({
    children,
    className,
    delay = 0,
    show = true,
}: MotionFadeProps) {
    return (
        <AnimatePresence mode="wait">
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: scale.initial }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: scale.initial }}
                    transition={{
                        duration: timing.normal,
                        delay,
                        ease: easing.bounce,
                    }}
                    className={className}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
});
