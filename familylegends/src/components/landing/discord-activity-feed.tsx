'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  MessageSquare,
  Volume2,
  Trophy,
  Gamepad2,
  Star,
  Shield,
  Megaphone,
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedActivity {
  id: number;
  icon: React.ElementType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  time: string;
  timestamp: number;
}

const demoActivities: FeedActivity[] = [
  {
    id: 1,
    icon: UserPlus,
    title: 'عضو جديد انضم',
    description: 'انضم @DragonSlayer_99 إلى السيرفر',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    time: 'منذ 3 دقائق',
    timestamp: Date.now() - 3 * 60 * 1000,
  },
  {
    id: 2,
    icon: Volume2,
    title: 'بث مباشر بدأ',
    description: '@NightOwl بدأ البث على Twitch — يلعب فالورانت',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    time: 'منذ 12 دقيقة',
    timestamp: Date.now() - 12 * 60 * 1000,
  },
  {
    id: 3,
    icon: Trophy,
    title: 'بطولة أسبوعية',
    description: 'تم افتتاح تسجيل بطولة Apex Legends — جوائز قيّمة!',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    time: 'منذ 25 دقيقة',
    timestamp: Date.now() - 25 * 60 * 1000,
  },
  {
    id: 4,
    icon: Gamepad2,
    title: 'لعبة جماعية',
    description: 'بدأت مجموعة جديدة في Among Us — 8 لاعبين',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    time: 'منذ 38 دقيقة',
    timestamp: Date.now() - 38 * 60 * 1000,
  },
  {
    id: 5,
    icon: Star,
    title: 'إنجاز جديد',
    description: 'حصل @Phoenix_Rise على شارة "أسطوري" — المركز الأول',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    time: 'منذ 45 دقيقة',
    timestamp: Date.now() - 45 * 60 * 1000,
  },
];

const VISIBLE_COUNT = 5;

export function DiscordActivityFeed() {
  const [showAll, setShowAll] = useState(false);
  const [activities, setActivities] = useState<FeedActivity[]>(demoActivities);

  useEffect(() => {
    async function fetchWebhookData() {
      try {
        const response = await fetch('/api/webhooks/discord');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
             // In a real app, we would merge or replace the demo data
             // For now, we keep it as a showcase but this is where it would go
          }
        }
      } catch (error) {
        console.error('Failed to fetch discord activities:', error);
      }
    }
    fetchWebhookData();
  }, []);

  const visibleActivities = showAll ? activities : activities.slice(0, VISIBLE_COUNT);
  const hasMore = activities.length > VISIBLE_COUNT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      dir="rtl"
    >
      <div className="rounded-2xl glass-card border border-border/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#5865F2]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-sm">آخر النشاطات</h3>
            <p className="text-xs text-muted-foreground/60">سيرفر Family Legends</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <Clock className="w-3 h-3" />
            <span>مباشر</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="relative">
            <div className="absolute top-0 bottom-0 right-[19px] w-px bg-gradient-to-b from-border/30 via-border/20 to-transparent" />

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {visibleActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={activity.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative pr-11"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${activity.bgColor} border-2 border-card z-10`}
                      />

                      <motion.div
                        whileHover={{ scale: 1.02, x: -4 }}
                        className={`rounded-xl p-3 border transition-all duration-300 ${activity.bgColor} ${activity.borderColor} group cursor-default hover:shadow-lg`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg ${activity.bgColor} flex items-center justify-center flex-shrink-0 border ${activity.borderColor}`}>
                            <Icon className={`w-4 h-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-foreground/90 block mb-0.5">
                              {activity.title}
                            </span>
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-1 leading-relaxed">
                              {activity.description}
                            </p>
                            <span className="text-[10px] text-muted-foreground/40 mt-1 block">
                              {activity.time}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {activities.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground/50 text-sm">لا توجد نشاطات حالياً</p>
            </motion.div>
          )}

          {hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-muted-foreground/70 hover:text-primary hover:bg-primary/5 gap-1.5 h-9 px-4 rounded-full border border-transparent hover:border-primary/20 transition-all duration-300"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>عرض أقل</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>+{activities.length - VISIBLE_COUNT} نشاط</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
