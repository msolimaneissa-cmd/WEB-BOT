'use client';

import React, { useEffect, useRef } from 'react';

interface RainEffectProps {
    intensity?: 'light' | 'medium' | 'heavy';
}

export function RainEffect({ intensity = 'medium' }: RainEffectProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let drops: { x: number; y: number; speed: number; length: number; opacity: number }[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createDrops = () => {
            const dropCount = intensity === 'light' ? 30 : intensity === 'medium' ? 60 : 120; // Reduced by 70%
            drops = [];
            for (let i = 0; i < dropCount; i++) {
                drops.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    speed: Math.random() * 4 + 2, // Speed between 2 and 6 (slower)
                    length: Math.random() * 20 + 10, // Length between 10 and 30 (shorter)
                    opacity: Math.random() * 0.3 + 0.1, // Opacity between 0.1 and 0.4 (more subtle)
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)'; // Soft blueish tint
            ctx.lineWidth = 1; // Thinner lines
            ctx.lineCap = 'round';

            drops.forEach((drop) => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x, drop.y + drop.length);
                ctx.globalAlpha = drop.opacity;
                ctx.stroke();

                // Update position
                drop.y += drop.speed;

                // Reset if off screen
                if (drop.y > canvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * canvas.width;
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        createDrops();
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [intensity]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-30"
            style={{ mixBlendMode: 'screen' }}
        />
    );
}
