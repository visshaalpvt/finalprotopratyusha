'use client';

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, ThemeMode } from '@/stores/useThemeStore';
import { timing, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

const themeOptions: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'auto', icon: Monitor, label: 'System' },
];

const ThemeToggle = memo(function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
    const { mode, setMode } = useThemeStore();
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    const cycleTheme = useCallback(() => {
        const currentIndex = themeOptions.findIndex(opt => opt.value === mode);
        const nextIndex = (currentIndex + 1) % themeOptions.length;
        setMode(themeOptions[nextIndex].value);
    }, [mode, setMode]);

    const CurrentIcon = themeOptions.find(opt => opt.value === mode)?.icon || Monitor;
    const currentLabel = themeOptions.find(opt => opt.value === mode)?.label || 'System';

    return (
        <motion.button
            onClick={cycleTheme}
            className={cn(
                "flex items-center gap-2 p-2 rounded-full hover:bg-bg-tertiary transition-colors",
                className
            )}
            whileHover={!reducedMotion ? { scale: 1.05 } : undefined}
            whileTap={!reducedMotion ? { scale: 0.95 } : undefined}
            transition={{ duration: timing.fast }}
            aria-label={`Current theme: ${currentLabel}. Click to change.`}
            title={`Theme: ${currentLabel}`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    initial={reducedMotion ? { opacity: 1 } : { rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={reducedMotion ? { opacity: 0 } : { rotate: 90, opacity: 0 }}
                    transition={{ duration: timing.fast }}
                >
                    <CurrentIcon className="w-5 h-5 text-text-primary" />
                </motion.div>
            </AnimatePresence>
            {showLabel && (
                <span className="text-sm text-text-secondary">{currentLabel}</span>
            )}
        </motion.button>
    );
});

export default ThemeToggle;
