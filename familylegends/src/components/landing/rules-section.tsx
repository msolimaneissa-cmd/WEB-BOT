'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Shield, ChevronDown, ChevronUp, BookOpen, ShieldCheck, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rule } from "@/lib/data";
import { useTranslations } from 'next-intl';

interface RulesContentProps {
  rules: Rule[] | null;
  isLoading: boolean;
}

function RulesContent({ rules, isLoading }: RulesContentProps) {
  const t = useTranslations('Landing');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const toggleRule = (id: string) => {
    setExpandedRule(expandedRule === id ? null : id);
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
    hidden: { opacity: 0, y: 30, scale: 0.98 },
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-3xl bg-card/20 animate-pulse border border-border/10" />
        ))}
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-24 rounded-[2.5rem] border border-dashed border-primary/20 bg-card/10 backdrop-blur-md"
      >
        <div className="inline-flex p-6 rounded-3xl bg-primary/10 mb-6 border border-primary/20">
          <BookOpen className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{t('rules.emptyTitle')}</h3>
        <p className="text-muted-foreground text-lg">{t('rules.emptyDescription')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
    >
      {rules.map((rule, index) => (
        <motion.div key={rule.id || index} variants={itemVariants} className="group h-full">
          <div className={cn(
            "glass-card relative h-full flex flex-col p-8 rounded-[2.5rem] overflow-hidden transition-all duration-500",
            "border border-white/5 hover:border-primary/30",
            "hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(255,215,0,0.15)] bg-gradient-to-b from-white/5 to-transparent"
          )}>
            {/* Header with Number */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-amber-500 to-yellow-600 flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <span className="font-headline text-2xl font-black text-black">{(index + 1).toString().padStart(2, '0')}</span>
                </div>
              </div>
              <Shield className="w-6 h-6 text-primary/30 group-hover:text-primary transition-colors duration-500" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-headline text-xl font-black text-white mb-4 group-hover:text-primary transition-colors leading-tight tracking-tight uppercase">
                {rule.title}
              </h3>
              <p className="text-sm text-muted-foreground group-hover:text-white/80 transition-colors leading-relaxed">
                {rule.description}
              </p>
            </div>

            {/* Visual Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
               <Zap className="w-4 h-4 text-primary animate-pulse" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function deduplicateRules(rules: Rule[]): Rule[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  return rules.filter(rule => {
    const normalizedTitle = rule.title?.trim().toLowerCase() ?? '';
    if (rule.id && seenIds.has(rule.id)) return false;
    if (normalizedTitle && seenTitles.has(normalizedTitle)) return false;
    if (rule.id) seenIds.add(rule.id);
    if (normalizedTitle) seenTitles.add(normalizedTitle);
    return true;
  });
}

export function RulesSection({ initialRules }: { initialRules?: Rule[] }) {
  const t = useTranslations('Landing');
  const [rules, setRules] = useState<Rule[]>(initialRules ? deduplicateRules(initialRules) : []);
  const [isLoading, setIsLoading] = useState(!initialRules);

  useEffect(() => {
    if (initialRules) return;
    async function fetchRules() {
      try {
        const response = await fetch('/api/bot/rules');
        const data = await response.json();
        setRules(deduplicateRules(Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('Error fetching rules:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRules();
  }, [initialRules]);

  return (
    <section id="rules" className="py-24 md:py-32 relative overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-primary/20 bg-card/30 backdrop-blur-md mb-12 group"
          >
            <ShieldCheck className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-black text-primary tracking-widest uppercase">The Eternal Code</span>
            <ShieldCheck className="w-5 h-5 text-primary group-hover:-rotate-12 transition-transform" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-headline text-4xl sm:text-5xl md:text-6xl font-black text-white glow-sm mb-10 flex items-center justify-center gap-6 pt-8 pb-4 leading-relaxed"
          >
            <Flame className="w-10 h-10 md:w-12 md:h-12 text-primary animate-pulse" />
{t('rules.sectionTitle')} <span className="text-gold">{t('rules.sectionTitleHighlight')}</span>
            <Flame className="w-10 h-10 md:w-12 md:h-12 text-primary animate-pulse -scale-x-100" />
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            {t('rules.sectionSubtitle')}
          </motion.p>
        </div>

        <RulesContent rules={rules} isLoading={isLoading} />
      </div>
    </section>
  );
}
