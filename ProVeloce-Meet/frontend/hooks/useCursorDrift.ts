'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { cursorDriftConfig, isLowPowerDevice, prefersReducedMotion } from '@/lib/motion';

interface UseCursorDriftOptions {
    enabled?: boolean;
    maxRotate?: number;
    maxTranslate?: number;
}

interface DriftTransform {
    rotateX: number;
    rotateY: number;
    translateX: number;
    translateY: number;
}

/**
 * useCursorDrift - Subtle cursor-based parallax effect for cards/dashboard
 * Automatically disabled on mobile and low-power devices
 */
export function useCursorDrift<T extends HTMLElement>(
    options: UseCursorDriftOptions = {}
) {
    const {
        enabled = true,
        maxRotate = cursorDriftConfig.maxRotate,
        maxTranslate = cursorDriftConfig.maxTranslate,
    } = options;

    const ref = useRef<T>(null);
    const [isActive, setIsActive] = useState(false);
    const transformRef = useRef<DriftTransform>({ rotateX: 0, rotateY: 0, translateX: 0, translateY: 0 });
    const rafRef = useRef<number | null>(null);

    // Check if effect should run
    const shouldRun = enabled && typeof window !== 'undefined' && !isLowPowerDevice() && !prefersReducedMotion();

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!ref.current || !shouldRun) return;

        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate normalized position (-1 to 1)
        const normalizedX = (e.clientX - centerX) / (rect.width / 2);
        const normalizedY = (e.clientY - centerY) / (rect.height / 2);

        // Clamp to avoid extreme values
        const clampedX = Math.max(-1, Math.min(1, normalizedX));
        const clampedY = Math.max(-1, Math.min(1, normalizedY));

        // Target transform
        const targetRotateX = -clampedY * maxRotate;
        const targetRotateY = clampedX * maxRotate;
        const targetTranslateX = clampedX * maxTranslate;
        const targetTranslateY = clampedY * maxTranslate;

        // Smooth interpolation
        const smooth = cursorDriftConfig.smooth;
        transformRef.current = {
            rotateX: transformRef.current.rotateX + (targetRotateX - transformRef.current.rotateX) * smooth,
            rotateY: transformRef.current.rotateY + (targetRotateY - transformRef.current.rotateY) * smooth,
            translateX: transformRef.current.translateX + (targetTranslateX - transformRef.current.translateX) * smooth,
            translateY: transformRef.current.translateY + (targetTranslateY - transformRef.current.translateY) * smooth,
        };

        // Apply transform
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (ref.current) {
                const { rotateX, rotateY, translateX, translateY } = transformRef.current;
                ref.current.style.transform = `perspective(${cursorDriftConfig.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${translateX}px, ${translateY}px, 0)`;
            }
        });
    }, [shouldRun, maxRotate, maxTranslate]);

    const handleMouseEnter = useCallback(() => {
        if (shouldRun) setIsActive(true);
    }, [shouldRun]);

    const handleMouseLeave = useCallback(() => {
        setIsActive(false);
        // Reset transform smoothly
        if (ref.current) {
            ref.current.style.transition = 'transform 0.3s ease-out';
            ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
            transformRef.current = { rotateX: 0, rotateY: 0, translateX: 0, translateY: 0 };

            // Remove transition after reset
            setTimeout(() => {
                if (ref.current) {
                    ref.current.style.transition = '';
                }
            }, 300);
        }
    }, []);

    useEffect(() => {
        const element = ref.current;
        if (!element || !shouldRun) return;

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('mousemove', handleMouseMove);

        return () => {
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
            element.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [shouldRun, handleMouseEnter, handleMouseLeave, handleMouseMove]);

    return { ref, isActive };
}

export default useCursorDrift;
