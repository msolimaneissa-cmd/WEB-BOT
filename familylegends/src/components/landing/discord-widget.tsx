'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Users,
  MessageCircle,
  Zap,
  Crown,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DiscordServerStats } from '@/lib/data';

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString('ar-SA')}</span>;
}

interface FakeActivity {
  id: number;
  icon: React.ElementType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  time: string;
}

const sampleActivities: FakeActivity[] = [
  {
    id: 1,
    icon: Users,
    title: 'عضو جديد انضم',
    description: 'انضم @Player_001 إلى السيرفر',
    color: 'text-green-400',
    time: 'منذ 3 دقائق',
  },
  {
    id: 2,
    icon: Crown,
    title: 'بطولة جديدة',
    description: 'تم بدء بطولة فالورانت الأسبوعية',
    color: 'text-primary',
    time: 'منذ 15 دقيقة',
  },
  {
    id: 3,
    icon: Activity,
    title: 'لعبة جماعية',
    description: 'بدأت مجموعة جديدة في Among Us',
    color: 'text-blue-400',
    time: 'منذ 25 دقيقة',
  },
  {
    id: 4,
    icon: Zap,
    title: 'إنجاز جديد',
    description: 'تم فتح شارة "أسطوري" من قبل 50 عضواً',
    color: 'text-orange-400',
    time: 'منذ ساعة',
  },
];

export function DiscordWidget() {
  const [stats, setStats] = useState<DiscordServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeActivityIndex, setActiveActivityIndex] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/discord-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      setStats({
        onlineMembers: 142,
        totalMembers: 3847,
        boostCount: 18,
        channelCount: 45,
        roleCount: 32,
        lastUpdated: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveActivityIndex((prev) => (prev + 1) % sampleActivities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const displayStats = stats || {
    onlineMembers: 142,
    totalMembers: 3847,
    boostCount: 18,
    channelCount: 45,
    roleCount: 32,
    lastUpdated: Date.now(),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      dir="rtl"
    >
      <div className="relative rounded-2xl overflow-hidden glass-card border border-[#5865F2]/30">
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5865F2]/60 to-transparent" />

        {/* Ambient glow */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-[#5865F2]/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="relative p-5 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-lg shadow-[#5865F2]/20">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-card" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg font-bold text-white truncate">
                Family Legends
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <span className="text-xs text-green-400 font-medium">متصل الآن</span>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="gap-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-lg transition-all duration-300 hover:scale-105"
            >
              <a href="https://discord.gg/familylegends" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">انضم</span>
              </a>
            </Button>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Online Members */}
              <div className="glass rounded-xl p-3 border border-white/5 hover:border-green-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">متصل الآن</span>
                </div>
                <div className="text-2xl font-black text-green-400 font-heading">
                  <AnimatedCounter target={displayStats.onlineMembers} />
                </div>
              </div>

              {/* Total Members */}
              <div className="glass rounded-xl p-3 border border-white/5 hover:border-[#5865F2]/30 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-[#5865F2]/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                  </div>
                  <span className="text-xs text-muted-foreground">إجمالي الأعضاء</span>
                </div>
                <div className="text-2xl font-black text-white font-heading">
                  <AnimatedCounter target={displayStats.totalMembers} />
                </div>
              </div>

              {/* Boost Count */}
              <div className="glass rounded-xl p-3 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">البوستات</span>
                </div>
                <div className="text-2xl font-black text-primary font-heading">
                  <AnimatedCounter target={displayStats.boostCount} />
                </div>
              </div>

              {/* Channels */}
              <div className="glass rounded-xl p-3 border border-white/5 hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">القنوات</span>
                </div>
                <div className="text-2xl font-black text-purple-400 font-heading">
                  <AnimatedCounter target={displayStats.channelCount} />
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground/70">آخر النشاطات</span>
            </div>

            <div className="relative h-14 overflow-hidden rounded-xl">
              {sampleActivities.map((activity, index) => {
                const Icon = activity.icon;
                const isActive = index === activeActivityIndex;
                return (
                  <motion.div
                    key={activity.id}
                    initial={false}
                    animate={{
                      y: isActive ? 0 : index < activeActivityIndex ? -56 : 56,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="absolute inset-0 flex items-center gap-3 p-2.5 glass border border-white/5 rounded-xl"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground/90 truncate">{activity.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">{activity.time}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Activity dots */}
            <div className="flex justify-center gap-1 mt-3">
              {sampleActivities.map((_, index) => (
                <motion.div
                  key={index}
                  animate={{
                    width: index === activeActivityIndex ? 16 : 4,
                    backgroundColor: index === activeActivityIndex ? '#FFD700' : 'rgba(255,255,255,0.2)',
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-1 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
