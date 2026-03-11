'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
    mode: ThemeMode;
    resolvedTheme: ResolvedTheme;
    setMode: (mode: ThemeMode) => void;
    setResolvedTheme: (theme: ResolvedTheme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'auto',
            resolvedTheme: 'light',
            setMode: (mode) => set({ mode }),
            setResolvedTheme: (theme) => set({ resolvedTheme: theme }),
        }),
        {
            name: 'proveloce-theme',
            partialize: (state) => ({ mode: state.mode }),
        }
    )
);

// Selector hooks
export const useThemeMode = () => useThemeStore((s) => s.mode);
export const useResolvedTheme = () => useThemeStore((s) => s.resolvedTheme);
