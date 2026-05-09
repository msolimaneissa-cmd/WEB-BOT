'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import { Handshake, MessageCircle, Radio, Play, Globe, User, Video, Shield, Crown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { AllianceRequestModal } from './alliance-request-modal';
import type { Partner } from '@/lib/data';
import { useTranslations } from 'next-intl';

const socialIcons: Record<string, React.ElementType<{ className?: string }>> = {
  discord: MessageCircle,
  twitch: Radio,
  youtube: Play,
  twitter: Globe,
  instagram: Globe,
  facebook: Globe,
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

export function PartnersSection({ initialPartners }: { initialPartners?: Partner[] }) {
  const t = useTranslations('Landing');
  const firestore = useFirestore();

  const partnersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partners'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: partnersCollectionData, isLoading: partnersLoading } = useCollection<Partner>(
    partnersCollection,
    false
  );

  const partners = partnersCollectionData || initialPartners;

  return (
    <section id="partners" className="py-16 md:py-24 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#5865F2]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary/30 mb-12"
          >
            <Handshake className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-gradient-gold tracking-wider">Strategic Alliances</span>
            <Handshake className="w-4 h-4 text-primary" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white glow-sm mb-6 pt-8 pb-4 leading-relaxed"
          >
{t('partners.title')} <span className="text-gold">{t('partners.titleHighlight')}</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed"
          >
            {t('partners.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {partnersLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-card/20 animate-pulse border border-border/10" />
            ))
          ) : partners && partners.length > 0 ? (
            <>
              {partners.map((partner) => (
                <motion.div key={partner.id} variants={itemVariants}>
                  <PartnerCard partner={partner} />
                </motion.div>
              ))}
              
              {/* Alliance Request Card integrated into the grid */}
              <motion.div
                variants={itemVariants}
                className="glass-card p-8 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-[2rem] flex flex-col justify-between border border-primary/20 group hover:border-primary/40 transition-all duration-500 min-h-[300px]"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Shield className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-headline text-2xl font-black text-white mb-4">{t('partners.cardTitle')}</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {t('partners.cardDescription')}
                  </p>
                </div>
                <AllianceRequestModal />
              </motion.div>
            </>
          ) : (
            <div className="col-span-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[400px] group rounded-[2.5rem]"
              >
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Handshake className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-headline text-3xl font-black text-white mb-4">{t('partners.emptyTitle')}</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed">
                  {t('partners.emptyDescription')}
                </p>
                <AllianceRequestModal />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  const t = useTranslations('Landing');
  return (
    <div className="group relative h-full rounded-[2rem] overflow-hidden glass-card border border-border/30 hover:border-primary/40 transition-all duration-500 hover:-translate-y-2">
      <div className="relative flex flex-col items-center p-6 md:p-8 text-center h-full">
        <div className="relative mb-5">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] overflow-hidden border-2 border-border/30 group-hover:border-primary/50 shadow-lg transition-all duration-500">
            <Image src={partner.logoUrl} alt={partner.name} fill sizes="80px" className="object-cover" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-card" />
          </span>
        </div>

        <h3 className="font-headline text-lg md:text-xl font-black text-white group-hover:text-gold transition-colors mb-2">
          {partner.name}
        </h3>

        {partner.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {partner.description}
          </p>
        )}

        <div className="flex gap-2 mb-6">
          {partner.socialLinks && Object.entries(partner.socialLinks).map(([platform, url]) => {
            if (!url) return null;
            const Icon = socialIcons[platform];
            if (!Icon) return null;
            return (
              <Link
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg glass border border-white/5 flex items-center justify-center hover:bg-primary hover:text-black transition-all duration-300 opacity-70 group-hover:opacity-100"
              >
                <Icon className="w-3.5 h-3.5" />
              </Link>
            );
          })}
        </div>

        <div className="flex gap-2 w-full mt-auto">
          {partner.streamUrl && (
            <Link
              href={partner.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#9146FF]/90 text-white rounded-xl hover:bg-[#9146FF] transition-colors text-xs font-medium"
            >
              <Video className="w-3 h-3" />
                    <span>{t('partners.stream')}</span>
            </Link>
          )}
          <Link
            href={partner.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 bg-primary text-black rounded-xl hover:bg-primary/90 transition-all duration-300 text-xs font-bold',
              partner.streamUrl ? 'flex-1' : 'w-full'
            )}
          >
            <Handshake className="w-3 h-3" />
            <span>{t('partners.join')}</span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-l from-primary to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right" />
      </div>
    </div>
  );
}
