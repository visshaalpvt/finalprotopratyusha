'use client';

import { ReactNode, useEffect, useCallback } from 'react';
import { useThemeStore, ThemeMode, ResolvedTheme } from '@/stores/useThemeStore';

// Script to inject before hydration to prevent flash
const themeScript = `
(function() {
  try {
    const stored = localStorage.getItem('proveloce-theme');
    const parsed = stored ? JSON.parse(stored) : null;
    const mode = parsed?.state?.mode || 'auto';
    
    let theme = 'light';
    if (mode === 'dark') {
      theme = 'dark';
    } else if (mode === 'auto') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export function ThemeScript() {
    return (
        <script
            dangerouslySetInnerHTML={{ __html: themeScript }}
            suppressHydrationWarning
        />
    );
}

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const { mode, setResolvedTheme } = useThemeStore();

    const updateTheme = useCallback((newMode: ThemeMode) => {
        let resolved: ResolvedTheme = 'light';

        if (newMode === 'dark') {
            resolved = 'dark';
        } else if (newMode === 'auto') {
            resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        setResolvedTheme(resolved);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
        document.documentElement.style.colorScheme = resolved;
    }, [setResolvedTheme]);

    // Update on mode change
    useEffect(() => {
        updateTheme(mode);
    }, [mode, updateTheme]);

    // Listen for OS theme changes
    useEffect(() => {
        if (mode !== 'auto') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => updateTheme('auto');

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [mode, updateTheme]);

    return <>{children}</>;
}

export default ThemeProvider;
