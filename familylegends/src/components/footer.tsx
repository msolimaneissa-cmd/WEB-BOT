'use client';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUp, MessageCircle, Play, Globe, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const socialLinks = [
  { icon: MessageCircle, href: '#', label: 'Discord', color: 'hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2]' },
  { icon: Globe, href: '#', label: 'Twitter', color: 'hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]' },
  { icon: Play, href: '#', label: 'YouTube', color: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]' },
  { icon: Globe, href: '#', label: 'Instagram', color: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:text-white hover:border-transparent' },
];

const quickLinks = [
  { label: 'القوانين', href: '#rules' },
  { label: 'الترسانة', href: '#armory-section' },
  { label: 'الألعاب', href: '#games' },
  { label: 'الفريق', href: '#team' },
  { label: 'الستريمرز', href: '#streamers' },
];

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <footer className="relative overflow-hidden mt-auto border-t border-white/5 bg-black/40 backdrop-blur-xl py-12">
      <div className="section-container">
        <div className="flex flex-col items-center justify-center gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-headline text-3xl font-black text-gold tracking-tight mb-2">
              𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground font-medium text-lg">
              <span>صنع بكل</span>
              <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
              <span className="text-gold font-black uppercase tracking-tighter ml-1">بواسطة سام المصري</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} Family Legends. All rights reserved.
          </p>

          <button
            onClick={scrollToTop}
            className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center text-primary hover:border-primary/50 transition-all shadow-xl group"
            aria-label="العودة للأعلى"
          >
            <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
