'use client';
import React from 'react';
import { FilesSection } from './files-section';
import { X, FolderOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FilesModal({ isOpen, onClose }: FilesModalProps) {
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
                    {/* Backdrop */}
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
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="fixed inset-0 z-50 overflow-y-auto"
                        onClick={onClose}
                    >
                        <div className="min-h-screen px-4 py-6 md:py-8 flex items-start justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="relative w-full max-w-6xl rounded-3xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Glass-morphism container */}
                                <div className="relative bg-gradient-to-b from-card/90 via-card/80 to-background/95 backdrop-blur-2xl border border-primary/20 shadow-2xl shadow-primary/10">
                                    {/* Top gradient line */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                                    
                                    {/* Ambient glow effects */}
                                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                                    
                                    {/* Animated particles */}
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                        {[...Array(6)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute w-1 h-1 bg-primary/30 rounded-full"
                                                style={{
                                                    left: `${10 + i * 15}%`,
                                                    top: `${20 + (i % 3) * 20}%`,
                                                }}
                                                animate={{
                                                    y: [0, -20, 0],
                                                    opacity: [0.2, 0.6, 0.2],
                                                }}
                                                transition={{
                                                    duration: 3 + i * 0.5,
                                                    repeat: Infinity,
                                                    delay: i * 0.3,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Close Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onClose}
                                        className="absolute top-4 left-4 z-20 w-12 h-12 rounded-full glass border border-border/40 hover:border-primary/50 flex items-center justify-center transition-all duration-300 group"
                                        aria-label="إغلاق"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </motion.button>

                                    {/* Modal Header */}
                                    <div className="pt-8 pb-4 px-6 text-center">
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary/30 mb-4"
                                        >
                                            <FolderOpen className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-bold text-gradient-gold">مكتبة الملفات</span>
                                            <Sparkles className="w-4 h-4 text-primary" />
                                        </motion.div>
                                    </div>

                                    {/* Files Section Content */}
                                    <div className="pb-4">
                                        <FilesSection />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
