'use client';
import React, { useEffect } from 'react';

export function ThemeProvider({ children, ...props }: any) {
    // Always use dark mode
    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    }, []);

    // Extract invalid DOM props to avoid React warnings
    const { 
        attribute, 
        defaultTheme, 
        enableSystem, 
        forcedTheme, 
        storageKey,
        enableColorScheme,
        disableTransitionOnChange,
        themes,
        value,
        ...rest 
    } = props;

    return <div {...rest}>{children}</div>;
}
