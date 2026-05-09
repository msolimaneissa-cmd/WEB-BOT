'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Gamepad2, Trophy, MessageSquare, Zap, Crown, Star } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * end));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className="font-headline text-4xl md:text-5xl font-black text-gold drop-shadow-glow">
      {prefix}{count.toLocaleString('ar-EG')}{suffix}
    </span>
  );
}

const defaultStats = [
  { icon: Users, label: 'عضو في المجتمع', value: 2500, suffix: '+', gradient: 'from-blue-500/20 to-cyan-400/20', iconColor: 'text-blue-400' },
  { icon: Gamepad2, label: 'مستخدم نشط', value: 1500, suffix: '+', gradient: 'from-emerald-500/20 to-green-400/20', iconColor: 'text-green-400' },
  { icon: Trophy, label: 'تذكرة دعم', value: 50, suffix: '+', gradient: 'from-orange-500/20 to-amber-400/20', iconColor: 'text-orange-400' },
  { icon: MessageSquare, label: 'تحذير إداري', value: 100, suffix: '+', gradient: 'from-cyan-500/20 to-blue-500/20', iconColor: 'text-cyan-400' },
  { icon: Zap, label: 'سنة من التميز', value: 3, suffix: '', gradient: 'from-yellow-500/20 to-primary/20', iconColor: 'text-yellow-400' },
  { icon: Crown, label: 'ستريمر حصري', value: 20, suffix: '+', gradient: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-pink-400' },
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
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export function StatsSection({ statsOverride }: { statsOverride?: { label: string; value: number; suffix: string }[] }) {
  const displayStats = statsOverride 
    ? defaultStats.map((s) => {
        const override = statsOverride.find(o => o.label === s.label);
        // Only override if the API returned a meaningful (non-zero) value
        return override && override.value > 0 ? { ...s, ...override } : s;
      })
    : defaultStats;

  return (
    <section id="stats" className="py-16 md:py-24 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/20 bg-card/50 backdrop-blur-sm mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest uppercase">By The Numbers</span>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            أرقام تتحدث عنّا
          </h2>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground">
            إحصائيات حية تعكس حجم مجتمعنا وإنجازاتنا المستمرة.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {displayStats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group h-full"
            >
              <div className="glass-card relative h-full p-6 md:p-8 rounded-[1.5rem] text-center hover:-translate-y-2 hover:shadow-[0_8px_40px_rgba(255,215,0,0.15)] flex flex-col justify-center items-center gap-4 transition-all duration-500 border border-white/5 hover:border-primary/20">
                <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                
                <div className={cn(
                  "relative inline-flex p-3 md:p-4 rounded-2xl bg-gradient-to-br transition-transform duration-500 group-hover:scale-110 shadow-lg",
                  stat.gradient
                )}>
                  <stat.icon className={cn("w-6 h-6", stat.iconColor)} />
                </div>

                <div className="flex flex-col items-center">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  <p className="mt-2 text-xs md:text-sm font-bold text-muted-foreground group-hover:text-white transition-colors uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-[1.5rem]" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
