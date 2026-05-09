'use client';
import React from 'react';
import { ArmorySection } from './armory-section';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArmoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ArmoryModal({ isOpen, onClose }: ArmoryModalProps) {
    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - Glass-morphism overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                        className="fixed inset-0 z-50 overflow-y-auto"
                        onClick={onClose}
                    >
                        <div className="min-h-screen px-4 py-6 md:py-8 flex items-start justify-center">
                            <div
                                className="relative w-full max-w-6xl rounded-3xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Glass-morphism container */}
                                <div className="relative glass-strong border border-primary/20 shadow-2xl shadow-primary/10">
                                    {/* Top gradient line */}
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                                    
                                    {/* Ambient glow effects */}
                                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                                    {/* Close Button */}
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 left-4 z-20 w-11 h-11 rounded-full glass-card hover:border-primary/50 hover:bg-card flex items-center justify-center transition-all duration-300 group"
                                        aria-label="إغلاق"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </button>

                                    {/* Armory Section Content */}
                                    <div className="pt-8 pb-4">
                                        <ArmorySection />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
