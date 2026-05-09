'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { CommunitySettings } from "@/lib/data";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Sparkles, ChevronDown, MessageCircle } from "lucide-react";
import { useTranslations } from 'next-intl';

const LOGO_URL = "/images/logo.png";
const COMMUNITY_NAME = "𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮";

// Floating particle component
function FloatingParticle({ delay, size, x, duration }: { delay: number; size: number; x: string; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20 blur-sm"
      style={{
        width: size,
        height: size,
        left: x,
        bottom: '-10%',
      }}
      animate={{
        y: [0, -1000],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1, 0.5],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// Geometric shape component
function GeometricShape({ type, className, delay = 0 }: { type: 'hexagon' | 'diamond' | 'circle'; className?: string; delay?: number }) {
  const shapes = {
    hexagon: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon
          points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary/20"
        />
      </svg>
    ),
    diamond: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon
          points="50,5 95,50 50,95 5,50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary/20"
        />
      </svg>
    ),
    circle: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary/20"
        />
      </svg>
    ),
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: 'easeOut' }}
    >
      <motion.div
        animate={{
          rotate: type === 'hexagon' ? 360 : type === 'diamond' ? -360 : 0,
          scale: [1, 1.05, 1],
        }}
        transition={{
          rotate: { duration: 20 + delay * 5, repeat: Infinity, ease: 'linear' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        {shapes[type]}
      </motion.div>
    </motion.div>
  );
}

export function HeroSection({ communitySettings: initialSettings }: { communitySettings?: CommunitySettings | null }) {
  const t = useTranslations('Landing');
  const firestore = useFirestore();
  const settingsDoc = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'community') : null, [firestore]);
  const { data: fetchedSettings, isLoading: settingsLoading } = useDoc<CommunitySettings>(settingsDoc, false);
  
  const communitySettings = fetchedSettings || initialSettings;
  
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  // Mouse parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX - innerWidth / 2) / innerWidth);
      mouseY.set((clientY - innerHeight / 2) / innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const springConfig = { stiffness: 100, damping: 30 };
  const logoX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);
  const logoY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-15, 15]), springConfig);

  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<{ delay: number; size: number; x: string; duration: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    setParticles([...Array(15)].map((_, i) => ({
      delay: i * 0.5,
      size: Math.random() * 6 + 2,
      x: `${Math.random() * 100}%`,
      duration: Math.random() * 10 + 15,
    })));
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      dir="rtl"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <GeometricShape
          type="hexagon"
          className="absolute top-[15%] left-[10%] w-24 h-24 md:w-32 md:h-32 text-primary/10"
          delay={0.2}
        />
        <GeometricShape
          type="diamond"
          className="absolute top-[25%] right-[8%] w-20 h-20 md:w-28 md:h-28 text-primary/10"
          delay={0.4}
        />
        <GeometricShape
          type="circle"
          className="absolute bottom-[20%] left-[15%] w-16 h-16 md:w-24 md:h-24 text-primary/10"
          delay={0.6}
        />
        <GeometricShape
          type="hexagon"
          className="absolute bottom-[30%] right-[12%] w-20 h-20 md:w-28 md:h-28 text-primary/10"
          delay={0.8}
        />

        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="absolute inset-0 overflow-hidden">
          {mounted && particles.map((p, i) => (
            <FloatingParticle
              key={i}
              delay={p.delay}
              size={p.size}
              x={p.x}
              duration={p.duration}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="container mx-auto px-4 md:px-6 relative z-10 pt-24 md:pt-32"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 md:gap-12 py-10">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-right order-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-bold text-primary tracking-wider">{t('hero.badge')}</span>
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight"
            >
              <span className="block text-2xl sm:text-3xl md:text-4xl font-medium text-muted-foreground mb-2">
                {t('hero.welcome')}
              </span>
              <span className="text-gradient-gold glow-text block py-6 leading-relaxed">
                {COMMUNITY_NAME}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl max-w-xl text-muted-foreground mb-8 mx-auto lg:mx-0 leading-relaxed"
            >
              {t('hero.description')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-[#FDB931] to-primary rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <Button
                  asChild
                  size="lg"
                  disabled={settingsLoading || !communitySettings}
                  className="relative w-full sm:w-auto rounded-xl px-8 py-6 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 overflow-hidden group"
                >
                  <Link href={communitySettings?.discordInviteLink || '#'} target="_blank" className="flex items-center gap-3">
                    <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152a.074.074 0 0 0-.0785.0371c-.211.3753-.4464.8245-.6687 1.2643a18.061 18.061 0 0 0-2.6248 0a18.061 18.061 0 0 0-2.6248 0c-.2223-.4398-.4576-.889-.6687-1.2643a.074.074 0 0 0-.0785-.0371a19.791 19.791 0 0 0-4.8851 1.5152a.069.069 0 0 0-.0321.0233a22.215 22.215 0 0 0-3.4449 14.9822a.074.074 0 0 0 .0428.063c1.9125.9928 3.894 1.4423 5.7607 1.6218a.074.074 0 0 0 .063-.0428c.1428-.4285.2857-.857.4285-1.2855a.074.074 0 0 0-.0232-.0849a13.061 13.061 0 0 1-1.589-1.633a.074.074 0 0 1 .0045-.1017c.3214-.2321.6428-.482.9463-.7319a.074.074 0 0 1 .09-.0143a14.933 14.933 0 0 0 2.4318 1.4423a.074.074 0 0 0 .0849 0a14.933 14.933 0 0 0 2.4318-1.4423a.074.074 0 0 1 .09.0143c.3035.2499.6249.5.9463.7319a.074.074 0 0 1 .0045.1017a13.061 13.061 0 0 1-1.589 1.633a.074.074 0 0 1-.0232.0849c.1428.4285.2857.8571.4285 1.2855a.074.074 0 0 0 .063.0428c1.8667-.1795 3.8482-.629 5.7607-1.6218a.074.074 0 0 0 .0428-.063a22.215 22.215 0 0 0-3.4449-14.9822a.069.069 0 0 0-.0321-.0233zM8.02 15.3312c-1.1822 0-2.15-1.076-2.15-2.421c0-1.3448.9678-2.4208 2.15-2.4208c1.1822 0 2.1499 1.076 2.1499 2.4208c0 1.345-.9677 2.421-2.1499 2.421zm7.9648 0c-1.1822 0-2.15-1.076-2.15-2.421c0-1.3448.9678-2.4208 2.15-2.4208c1.1822 0 2.1499 1.076 2.1499 2.4208c0 1.345-.9677 2.421-2.1499 2.421z"/>
                    </svg>
                    <span className="relative z-10">{t('hero.cta')}</span>
                  </Link>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-xl px-8 py-6 text-lg font-bold border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-foreground transition-all duration-300"
                  onClick={() => {
                    const el = document.querySelector('#rules');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="flex items-center gap-2">
                    {t('hero.learnMore')}
                    <ChevronDown className="w-5 h-5 transition-transform group-hover:translate-y-1" />
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="flex justify-center items-center order-2"
            style={{ x: logoX, y: logoY }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 -m-8 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary) / 0.3), transparent, hsl(var(--primary) / 0.3), transparent)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              
              <motion.div
                className="absolute inset-0 -m-4 rounded-full bg-primary/20 blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative"
              >
                <Image
                  src={LOGO_URL}
                  alt="Community Logo"
                  width={500}
                  height={500}
                  className="relative w-full max-w-[280px] sm:max-w-[350px] md:max-w-[450px] h-auto drop-shadow-[0_0_60px_rgba(255,215,0,0.4)]"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 450px"
                  priority
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 cursor-pointer group"
          onClick={() => {
            const el = document.querySelector('#rules');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{t('hero.scrollDown')}</span>
          <div className="w-7 h-12 rounded-full border-2 border-primary/30 group-hover:border-primary/60 flex items-start justify-center p-2 transition-colors">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-3 rounded-full bg-primary/60 group-hover:bg-primary"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
