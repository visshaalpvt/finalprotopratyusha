'use client';

import { memo, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { timing, easing, stagger, blur, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface TextRevealProps {
    text: string;
    variant?: 'hero' | 'tagline' | 'heading' | 'body';
    splitBy?: 'char' | 'word';
    className?: string;
    charClassName?: string;
    staggerDelay?: number;
    initialDelay?: number;
    withGlow?: boolean;
    withBlur?: boolean;
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

/**
 * TextReveal - Cinematic text reveal animation
 * 
 * Reveals text character-by-character or word-by-word with optional glow effect.
 * Respects prefers-reduced-motion.
 */
const TextReveal = memo(function TextReveal({
    text,
    variant = 'heading',
    splitBy = 'char',
    className,
    charClassName,
    staggerDelay: customStagger,
    initialDelay = 0,
    withGlow = false,
    withBlur = false,
    as: Component = 'span',
}: TextRevealProps) {
    // Check for reduced motion preference
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    // Split text into characters or words
    const elements = useMemo(() => {
        if (splitBy === 'word') {
            return text.split(' ').map((word, i, arr) => ({
                text: word + (i < arr.length - 1 ? '\u00A0' : ''), // Add non-breaking space
                key: `word-${i}`,
            }));
        }
        // Character split
        return text.split('').map((char, i) => ({
            text: char === ' ' ? '\u00A0' : char,
            key: `char-${i}`,
        }));
    }, [text, splitBy]);

    // Get stagger timing based on variant
    const staggerTime = customStagger ?? (splitBy === 'word' ? stagger.word : stagger.char);

    // Animation variants for container
    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: reducedMotion ? 0 : staggerTime,
                delayChildren: initialDelay,
            },
        },
    };

    // Animation variants for each character/word
    const itemVariants: Variants = useMemo(() => {
        if (reducedMotion) {
            return {
                hidden: { opacity: 1 },
                visible: { opacity: 1 },
            };
        }

        const hidden: any = {
            opacity: 0,
            y: variant === 'hero' ? 30 : 20,
        };

        const visible: any = {
            opacity: 1,
            y: 0,
            transition: {
                duration: variant === 'hero' ? timing.cinematic : timing.normal,
                ease: easing.smooth,
            },
        };

        if (withBlur) {
            hidden.filter = `blur(${blur.subtle}px)`;
            visible.filter = 'blur(0px)';
        }

        return { hidden, visible };
    }, [variant, withBlur, reducedMotion]);

    // Variant-specific styles
    const variantStyles: Record<string, string> = {
        hero: 'text-5xl sm:text-6xl lg:text-7xl font-extrabold',
        tagline: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
        heading: 'text-xl sm:text-2xl font-semibold',
        body: 'text-base sm:text-lg',
    };

    // Glow animation for hero text
    const glowStyle = withGlow ? {
        textShadow: '0 0 20px rgba(26, 115, 232, 0.3), 0 0 40px rgba(26, 115, 232, 0.1)',
    } : {};

    return (
        <Component
            className={cn(
                'inline-flex flex-wrap',
                variantStyles[variant],
                className
            )}
            style={glowStyle}
            aria-label={text}
        >
            <motion.span
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="inline-flex flex-wrap"
            >
                {elements.map(({ text: char, key }) => (
                    <motion.span
                        key={key}
                        variants={itemVariants}
                        className={cn(
                            'inline-block',
                            withGlow && 'will-change-transform',
                            charClassName
                        )}
                    >
                        {char}
                    </motion.span>
                ))}
            </motion.span>
        </Component>
    );
});

export default TextReveal;

/**
 * HeroTitle - Pre-configured hero text reveal
 */
export const HeroTitle = memo(function HeroTitle({
    text,
    className,
    delay = 0,
}: {
    text: string;
    className?: string;
    delay?: number;
}) {
    return (
        <TextReveal
            text={text}
            variant="hero"
            splitBy="char"
            className={cn('gradient-text', className)}
            initialDelay={delay}
            withGlow
            withBlur
            as="h1"
        />
    );
});

/**
 * TaglineReveal - Word-by-word tagline reveal
 */
export const TaglineReveal = memo(function TaglineReveal({
    text,
    className,
    delay = 0.5,
}: {
    text: string;
    className?: string;
    delay?: number;
}) {
    return (
        <TextReveal
            text={text}
            variant="tagline"
            splitBy="word"
            className={cn('text-text-primary', className)}
            initialDelay={delay}
            withBlur
            as="p"
        />
    );
});
