'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Streamer } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clapperboard,
  MessageCircle,
  Globe,
  Play,
  Crown,
  Radio,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRef, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

const socialIcons: Record<string, React.ElementType<{ className?: string }>> = {
  discord: MessageCircle,
  twitch: Radio,
  youtube: Play,
  twitter: Globe,
  instagram: Globe,
  facebook: Globe,
};

const detectPlatform = (url: string) => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('twitch.tv'))
    return {
      name: 'تويتش',
      icon: Radio,
      color: 'bg-[#9146FF]',
      badgeColor: 'bg-[#9146FF]',
    };
  if (lowerUrl.includes('kick.com'))
    return {
      name: 'كيك',
      icon: Play,
      color: 'bg-[#53FC18]',
      badgeColor: 'bg-[#53FC18]',
    };
  if (lowerUrl.includes('tiktok.com'))
    return {
      name: 'تيك توك',
      icon: Play,
      color: 'bg-black border border-white/20',
      badgeColor: 'bg-black',
    };
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be'))
    return {
      name: 'يوتيوب',
      icon: Play,
      color: 'bg-[#FF0000]',
      badgeColor: 'bg-[#FF0000]',
    };
  return null;
};

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
  hidden: { opacity: 0, y: 40, scale: 0.9 },
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

export function StreamersSection({ initialStreamers }: { initialStreamers?: Streamer[] }) {
  const t = useTranslations('Landing');
  const firestore = useFirestore();
  const streamersCollection = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'streamers'), orderBy('timestamp', 'desc'))
        : null,
    [firestore]
  );
  const { data: streamersCollectionData, isLoading } = useCollection<Streamer>(streamersCollection, false);
  const streamers = streamersCollectionData || initialStreamers;
  const { toast } = useToast();

  const prevLiveIdsRef = useRef<Set<string>>(new Set());

  const sortedStreamers = useMemo(() => {
    if (!streamers) return null;
    return [...streamers].sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return 0;
    });
  }, [streamers]);

  useEffect(() => {
    if (!sortedStreamers) return;
    const currentLiveIds = new Set<string>(sortedStreamers.filter((s) => s.isLive).map((s) => s.id));
    currentLiveIds.forEach((id) => {
      if (!prevLiveIdsRef.current.has(id)) {
        const streamer = sortedStreamers.find((s) => s.id === id);
        if (streamer) {
          toast({
            title: `🔴 ${streamer.name} بدأ البث الآن!`,
            description: `شاهد ${streamer.name} يبث مباشرة الآن.`,
          });
        }
      }
    });
    prevLiveIdsRef.current = currentLiveIds;
  }, [sortedStreamers, toast]);

  const liveCount = sortedStreamers?.filter((s) => s.isLive).length || 0;

  return (
    <section id="streamers" className="py-16 md:py-24 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/20 bg-card/50 backdrop-blur-sm mb-12"
          >
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest uppercase">Legendary Streamers</span>
            <Radio className="w-4 h-4 text-primary" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white glow-sm mb-6 pt-8 pb-4 leading-relaxed"
          >
            أساطير <span className="text-gold">البث</span>
          </motion.h2>
          
          <div className="flex flex-col items-center gap-6">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed mb-0"
            >
              نخبة من صناع المحتوى الذين يشاركوننا لحظات المجد والمغامرة في عالم الألعاب.
            </motion.p>

            {liveCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex"
              >
                <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-pulse shadow-lg shadow-red-500/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  {liveCount} Live Now
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
        >
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-[28rem] rounded-[2.5rem] bg-card/20 animate-pulse border border-border/10" />
            ))
          ) : sortedStreamers && sortedStreamers.length > 0 ? (
            sortedStreamers.map((streamer, index) => {
              const platform = detectPlatform(streamer.channelLink || '');
              return (
                <motion.div
                  key={streamer.id}
                  variants={itemVariants}
                  className="glass-card overflow-hidden group hover:-translate-y-2 transition-all duration-500 !p-0 rounded-[2.5rem]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/20">
                    {/* Blurred Background to fill the frame elegantly */}
                    <Image
                      src={streamer.imageUrl}
                      alt=""
                      fill
                      sizes="10vw"
                      className="object-cover blur-3xl opacity-40 scale-125"
                      aria-hidden="true"
                    />
                    
                    {/* Main Avatar - Fully visible and centered */}
                    <Image
                      src={streamer.imageUrl}
                      alt={streamer.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-contain transition-all duration-700 group-hover:scale-105 relative z-10 p-2"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-20" />
                    
                    {streamer.isLive && (
                      <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-bounce">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        Live
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-90 group-hover:scale-100">
                      <Link href={streamer.channelLink || '#'} target="_blank" className="w-20 h-20 rounded-full glass border border-white/20 flex items-center justify-center text-white hover:text-primary hover:scale-110 transition-all shadow-2xl">
                        <Play className="w-10 h-10 fill-current ml-1.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-8 md:p-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="min-w-0">
                        <h3 className="font-headline text-2xl md:text-3xl font-black text-white group-hover:text-gold transition-colors tracking-tight mb-2 truncate">
                          {streamer.name}
                        </h3>
                        <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-[0.2em] truncate">
                          {streamer.role}
                        </p>
                      </div>
                      {platform && (
                        <div className={cn("w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500", platform.color)}>
                          <platform.icon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      {streamer.channelLink && (
                        <Link href={streamer.channelLink} target="_blank" className="btn-gold !h-14 flex-1 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/10 hover:shadow-primary/20 flex items-center justify-center rounded-2xl bg-primary text-black transition-colors hover:bg-primary/90">
                          مشاهدة القناة
                        </Link>
                      )}
                      
                      {streamer.socialLinks && (
                        <div className="flex gap-2">
                          {Object.entries(streamer.socialLinks).slice(0, 2).map(([p, url]) => {
                            const Icon = socialIcons[p] || Globe;
                            return url ? (
                              <Link key={p} href={url as string} target="_blank" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-all">
                                <Icon className="w-5 h-5" />
                              </Link>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-32 rounded-[2.5rem] border border-dashed border-border/40 bg-card/20 backdrop-blur-sm">
              <Radio className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
              <p className="text-muted-foreground text-xl font-medium">سيتم إضافة المبدعين قريباً.</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
