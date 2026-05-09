'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MotionCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    glowColor?: string;
}

export function MotionCard({ children, delay = 0, className, glowColor = 'rgba(255, 215, 0, 0.15)', ...props }: MotionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            className={cn(
                "monolith-card relative overflow-hidden group",
                "bg-card/40 backdrop-blur-md border border-border/50 rounded-xl",
                className
            )}
            {...props}
        >
            {/* Gradient border overlay on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, rgba(255,215,0,0.2) 0%, transparent 50%, rgba(255,215,0,0.1) 100%)`,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    padding: '1px',
                    borderRadius: 'inherit',
                }}
            />

            {/* Subtle glow behind card on hover */}
            <div className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"
                style={{ background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)` }}
            />

            {/* Top shine line on hover */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {children}
        </motion.div>
    );
}
