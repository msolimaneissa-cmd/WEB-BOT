'use client';

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { CommunitySettings } from "@/lib/data";
import { Users, MessageCircle, Zap, Trophy, ChevronLeft, Sparkles, Crown, Sword, Shield, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Users, label: 'مجتمع نشط', desc: 'أعضاء متفاعلين يومياً', gradient: 'from-blue-500 to-cyan-400' },
  { icon: MessageCircle, label: 'دعم 24/7', desc: 'فريق دعم متواصل', gradient: 'from-emerald-500 to-green-400' },
  { icon: Zap, label: 'فعاليات أسبوعية', desc: 'بطولات وتحديات', gradient: 'from-orange-500 to-amber-400' },
  { icon: Trophy, label: 'جوائز قيمة', desc: 'مراكز وجوائز حصرية', gradient: 'from-purple-500 to-violet-400' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export function CtaSection() {
  const firestore = useFirestore();
  const settingsDoc = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'community') : null, [firestore]);
  const { data: communitySettings } = useDoc<CommunitySettings>(settingsDoc, false);

  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<{ left: string; top: string; duration: number; delay: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    setParticles([...Array(15)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 4 + Math.random() * 3,
      delay: Math.random() * 2,
    })));
  }, []);

  return (
    <section id="cta" className="py-24 md:py-32 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0">
          {mounted && particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-primary/40 rounded-full"
              style={{
                left: p.left,
                top: p.top,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.6, 0.1],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Features removed as requested */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center"
        >
          <div className="relative p-12 md:p-24 rounded-[3rem] glass-card border border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10" />
            
            <div className="relative z-10">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass border border-primary/30 mb-10"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-black text-gold tracking-widest uppercase">Join Our Legacy</span>
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.div>

              <h2 className="font-headline text-5xl md:text-8xl font-black text-white mb-10 leading-[0.9] tracking-tighter">
                مستني إيه؟ <br />
                انضم لـ <span className="text-gold glow-lg drop-shadow-[0_0_40px_rgba(255,215,0,0.4)]">الأساطير</span>
              </h2>
              
              <p className="text-lg md:text-2xl text-muted-foreground/80 mb-16 max-w-2xl mx-auto leading-relaxed font-medium">
                كن جزءاً من مجتمع الأساطير واكتشف عالماً من المغامرات والتحديات والأصدقاء الذين ينتظرونك في كل لحظة. انضم لأكبر مجتمع عربي للألعاب الآن!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <Link 
                    href={communitySettings?.discordInviteLink || '#'} 
                    target="_blank" 
                    className="btn-gold !h-20 !px-16 text-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 rounded-[1.5rem] bg-primary text-black font-black transition-all hover:bg-gold"
                  >
                    <MessageCircle className="w-8 h-8" />
                    <span>ادخل ديسكورد</span>
                  </Link>
                </motion.div>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="btn-glass !h-20 !px-12 text-xl w-full sm:w-auto glass border border-white/20 text-white rounded-[1.5rem] font-bold hover:bg-white/10 transition-colors"
                >
                  العودة للأعلى
                </motion.button>
              </div>

              <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground/40 text-xs font-black uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary/40" />
                  <span>Secure Community</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-primary/40" />
                  <span>Diverse Gaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary/40" />
                  <span>Weekly Events</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
