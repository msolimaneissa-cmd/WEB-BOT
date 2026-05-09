import { useCallback } from 'react';

export function useSoundEffects() {
    const playHover = useCallback(() => {
        const audio = new Audio('/sounds/hover.mp3');
        audio.volume = 0.2;
        audio.play().catch(() => { }); // Ignore errors (e.g. if user hasn't interacted yet)
    }, []);

    const playClick = useCallback(() => {
        const audio = new Audio('/sounds/click.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => { });
    }, []);

    return { playHover, playClick };
}
