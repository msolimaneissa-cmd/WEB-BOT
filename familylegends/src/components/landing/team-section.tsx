'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Crown, MessageCircle, Radio, Play, Globe, Star, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/lib/data";
import { useTranslations } from 'next-intl';

const socialIcons: Record<string, React.ElementType> = {
  discord: MessageCircle,
  twitch: Radio,
  youtube: Play,
  twitter: Globe,
  instagram: Globe,
  facebook: Globe,
};

export function TeamSection({ initialTeam }: { initialTeam?: TeamMember[] }) {
  const t = useTranslations('Landing');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeam || []);
  const [isLoading, setIsLoading] = useState(!initialTeam);

  useEffect(() => {
    if (initialTeam) return;
    async function fetchTeam() {
      try {
        const response = await fetch('/api/bot/team'); 
        const data = await response.json();
        setTeamMembers(data);
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, [initialTeam]);

  return (
    <section id="team" className="py-16 md:py-24 bg-card/10 relative overflow-hidden" dir="rtl">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/20 bg-card/50 backdrop-blur-sm mb-12"
          >
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary tracking-widest uppercase">The Council of Legends</span>
            <Star className="w-4 h-4 text-primary fill-primary" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-gold mb-8 flex items-center justify-center gap-4 pt-10 pb-6 leading-relaxed"
          >
            <Crown className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            <span>{t('team.title')}</span>
            <Crown className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground"
          >
            {t('team.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-[28rem] rounded-[2.5rem] bg-card/20 animate-pulse border border-border/10" />
            ))
          ) : teamMembers && teamMembers.length > 0 ? (
            teamMembers.map((member, index) => {
              if (!member.imageUrl) return null;
              return (
                <motion.div
                  key={member.id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className={cn(
                    "group relative aspect-[3/4.5] rounded-[2.5rem] overflow-hidden shadow-2xl hover:-translate-y-2 transition-all duration-500",
                    index % 2 === 1 ? "lg:translate-y-12" : ""
                  )}
                >
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px w-8 bg-primary shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                      <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">{member.role}</span>
                    </div>
                    <h3 className="font-headline text-2xl md:text-3xl font-black text-white mb-6 group-hover:text-gold transition-colors tracking-tighter">
                      {member.name}
                    </h3>

                    {member.socialLinks && Object.keys(member.socialLinks).length > 0 && (
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        {Object.entries(member.socialLinks).map(([platform, url]) => {
                          if (!url) return null;
                          const Icon = socialIcons[platform];
                          if (!Icon) return null;
                          return (
                            <Link
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 group/icon shadow-xl"
                            >
                              <Icon className="w-5 h-5 group-hover/icon:scale-110" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="absolute top-8 right-8 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative z-10 w-full h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                      <Crown className="w-6 h-6 md:w-7 md:h-7 text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-32 rounded-[2.5rem] border border-dashed border-border/40 bg-card/20 backdrop-blur-sm col-span-full">
              <Users className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
              <p className="text-muted-foreground text-xl font-medium">{t('team.empty')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
