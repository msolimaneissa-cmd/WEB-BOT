'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Users, CalendarClock, LifeBuoy, Swords, Sparkles, Sword, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = 'all' | 'servers' | 'community' | 'events';

interface ArmoryItem {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  category: Category;
}

const armoryItems: ArmoryItem[] = [
  {
    icon: ShieldCheck,
    title: "درع الاستقرار",
    description: "سيرفراتنا محمية بأحدث التقنيات لتوفير تجربة لعب ثابتة وخالية من التقطيع، مما يضمن أن معاركك لن تتوقف أبداً.",
    gradient: "from-blue-500 to-cyan-400",
    category: 'servers'
  },
  {
    icon: Users,
    title: "روح المجتمع",
    description: "مجتمعنا هو قلب أسطورتنا. مكان يرحب بالجميع، حيث يتم تكوين الصداقات والتحالفات التي تدوم إلى الأبد.",
    gradient: "from-emerald-500 to-green-400",
    category: 'community'
  },
  {
    icon: CalendarClock,
    title: "بوصلة الفعاليات",
    description: "لا يوجد وقت للملل هنا. بطولات مستمرة، تحديات يومية، وجوائز قيمة توجه الأساطير دائماً نحو مغامرة جديدة.",
    gradient: "from-orange-500 to-amber-400",
    category: 'events'
  },
  {
    icon: LifeBuoy,
    title: "سحابة الدعم",
    description: "فريق الدعم الفني لدينا يراقب الأجواء على مدار الساعة، جاهزون لتقديم المساعدة وحل أي مشكلة تواجهك في رحلتك.",
    gradient: "from-purple-500 to-violet-400",
    category: 'servers'
  }
];

const categories: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'الكل', icon: Sword },
  { id: 'servers', label: 'السيرفرات', icon: ShieldCheck },
  { id: 'community', label: 'المجتمع', icon: Users },
  { id: 'events', label: 'الفعاليات', icon: Target },
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
  hidden: { opacity: 0, y: 40, scale: 0.95 },
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

export function ArmorySection() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filteredItems = activeCategory === 'all' 
    ? armoryItems 
    : armoryItems.filter(item => item.category === activeCategory);

  return (
    <section id="armory-section" className="py-16 md:py-24 bg-card/10 relative overflow-hidden" dir="rtl">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/20 bg-card/50 backdrop-blur-sm mb-6"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest uppercase">Legendary Arsenal</span>
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-gold mb-4 flex items-center justify-center gap-4"
          >
            <Swords className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            <span>ترسانة الأساطير</span>
            <Swords className="w-8 h-8 md:w-10 md:h-10 text-primary -scale-x-100" />
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground"
          >
            نحن لا نقدم مجرد سيرفر، نحن نوفر بيئة متكاملة مصممة خصيصاً لتلبية احتياجات اللاعبين المحترفين والهواة على حد سواء.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 md:mb-12"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm font-bold transition-all duration-300 min-h-[44px]",
                  isActive 
                    ? "bg-primary text-black shadow-lg shadow-primary/30" 
                    : "glass-card hover:border-primary/40 hover:bg-card/60"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group h-full"
              >
                <div className="glass-card relative h-full p-8 md:p-10 rounded-[2rem] text-center hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(255,215,0,0.1)] flex flex-col items-center min-h-[320px] transition-all duration-500">
                  <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50`} />
                  
                  <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div
                      className="absolute inset-[-1px] rounded-[2rem]"
                      style={{
                        background: `linear-gradient(135deg, rgba(255,215,0,0.3), transparent 50%, rgba(255,215,0,0.15))`,
                      }}
                    />
                  </div>

                  <div className={`relative w-20 h-20 rounded-[1.5rem] bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-2xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <item.icon className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="font-headline text-2xl font-black text-white mb-4 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-muted-foreground/80 text-base leading-relaxed flex-1 group-hover:text-white transition-colors">
                    {item.description}
                  </p>

                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l ${item.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-[2rem]`} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
