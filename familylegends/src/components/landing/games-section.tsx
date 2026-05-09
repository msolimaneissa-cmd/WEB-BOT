'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Game } from "@/lib/data";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Play, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export function GamesSection({ initialGames }: { initialGames?: Game[] }) {
  const firestore = useFirestore();
  const gamesCollection = useMemoFirebase(() => firestore ? query(collection(firestore, "games"), orderBy("timestamp", "desc")) : null, [firestore]);
  const { data: gamesCollectionData, isLoading } = useCollection<Game>(gamesCollection, false);
  const games = gamesCollectionData || initialGames;
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="games" className="py-16 md:py-24 bg-card/10 overflow-hidden" dir="rtl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/20 bg-card/50 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-widest uppercase">Legends Battlegrounds</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-gold mb-4 flex items-center justify-center gap-4"
          >
            <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            <span>ساحات المعارك</span>
            <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-primary -scale-x-100" />
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground"
          >
            اكتشف مجموعة الألعاب التي تشكل جوهر مغامراتنا اليومية وساحات تنافسنا المستمرة.
          </motion.p>
        </div>

        <div className="relative group/carousel">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-8 pt-4 hide-scrollbar snap-x snap-mandatory"
          >
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="min-w-[280px] md:min-w-[320px] aspect-[3/4] rounded-[2rem] bg-card/20 animate-pulse border border-border/10" />
              ))
            ) : games && games.length > 0 ? (
              games.map((game, index) => {
                if (!game.imageUrl) return null;
                return (
                  <motion.div
                    key={game.id || index}
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="min-w-[280px] md:min-w-[320px] aspect-[3/4] relative group overflow-hidden rounded-[2rem] snap-center shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  >
                    <Image
                      src={game.imageUrl}
                      alt={game.name}
                      fill
                      sizes="(max-width: 768px) 280px, 320px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="h-px w-8 bg-primary" />
                        <span className="text-primary text-[10px] font-black uppercase tracking-widest">Active Game</span>
                      </div>
                      <h3 className="font-headline text-2xl font-black text-white drop-shadow-lg mb-2">
                        {game.name}
                      </h3>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase">Legends Choice</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 rounded-[2rem] transition-colors duration-500 pointer-events-none" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-500">
                        <Play className="w-8 h-8 text-black fill-current mr-1" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="w-full text-center py-20 rounded-[2rem] border border-dashed border-border/40 bg-card/20 backdrop-blur-sm">
                <Gamepad2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <p className="text-muted-foreground text-xl">سيتم إضافة الألعاب قريباً.</p>
              </div>
            )}
          </div>

          <div className="hidden lg:flex justify-between absolute top-1/2 -translate-y-1/2 -left-6 -right-6 pointer-events-none">
            <button
              onClick={() => scroll('left')}
              className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:text-primary hover:border-primary/50 transition-all pointer-events-auto bg-black/20 backdrop-blur-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:text-primary hover:border-primary/50 transition-all pointer-events-auto bg-black/20 backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
