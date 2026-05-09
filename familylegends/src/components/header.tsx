'use client';

import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { LogIn, FileText, Menu, X, Swords, Gamepad2, Users, Crown, Handshake, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './ui/button';
import { FilesModal } from './landing/files-modal';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

const LOGO_URL = "/images/logo.png";
const COMMUNITY_NAME = "𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮";

export function Header() {
  const t = useTranslations('Navigation');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const navItems = [
    { label: t('stats'), href: '#streamers', icon: Radio },
    { label: t('rules'), href: '#rules', icon: Swords },
    { label: t('team'), href: '#team', icon: Users },
    { label: t('partners'), href: '#partners', icon: Handshake },
    { label: t('home'), href: '#cta', icon: Crown },
  ];

  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(10, 10, 12, 0)', 'rgba(10, 10, 12, 0.85)']
  );
  const headerBorder = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 215, 0, 0)', 'rgba(255, 215, 0, 0.1)']
  );
  const headerBlur = useTransform(scrollY, [0, 100], [0, 12]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    navItems.forEach((item) => {
      const section = document.querySelector(item.href);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = useCallback((href: string) => {
    setIsMobileMenuOpen(false);
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
  }, []);

  return (
    <>
      <motion.header
        style={{
          backgroundColor: headerBg,
          borderBottomColor: headerBorder,
          backdropFilter: useTransform(headerBlur, (v) => `blur(${v}px)`),
        }}
        className={cn(
          "fixed top-0 right-0 left-0 z-50 w-full border-b transition-all duration-300",
          isScrolled ? "py-2" : "py-4"
        )}
      >
        <div className="container flex items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <motion.div
              animate={{ scale: isScrolled ? 0.85 : 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-10 h-10 md:w-12 md:h-12"
            >
              <Image
                src={LOGO_URL}
                alt="Family Legends Logo"
                fill
                sizes="48px"
                className="rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                priority
              />
              <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-r from-primary/40 via-transparent to-primary/40 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            <motion.span
              animate={{
                scale: isScrolled ? 0.95 : 1,
                opacity: isScrolled ? 0.9 : 1
              }}
              className={cn(
                "font-headline font-black text-gold tracking-tight transition-all duration-500",
                isScrolled ? "text-lg" : "text-xl"
              )}
            >
              {COMMUNITY_NAME}
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.href;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-500 min-h-[44px] group/nav overflow-hidden",
                    isActive 
                      ? "text-primary shadow-[0_0_20px_rgba(255,215,0,0.1)] bg-primary/5" 
                      : "text-foreground/70 hover:text-white"
                  )}
                >
                  {/* Premium Hover Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover/nav:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  
                  <item.icon className={cn(
                    "w-4 h-4 transition-all duration-500 relative z-10",
                    isActive 
                      ? "text-primary drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] scale-110" 
                      : "text-primary/40 group-hover/nav:text-primary/80 group-hover/nav:scale-110"
                  )} />
                  <span className="text-xs font-black uppercase tracking-widest relative z-10">{item.label}</span>
                  
                  {isActive ? (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  ) : (
                    <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary/40 scale-x-0 group-hover/nav:scale-x-50 transition-transform duration-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setIsFilesOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-300 group/files"
            >
              <FileText className="w-4 h-4 text-primary/60 group-hover/files:text-primary transition-colors" />
              <span className="uppercase tracking-widest">المخطوطات</span>
            </button>

            <div className="hidden md:block w-px h-6 bg-white/10" />

            <LanguageSwitcher />

            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'hidden sm:flex items-center gap-2 text-foreground/70 hover:text-primary hover:bg-primary/10 transition-all duration-500 rounded-xl px-4 font-bold border border-transparent hover:border-primary/20'
              )}
            >
              <LogIn className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest">{t('login')}</span>
            </Link>

            {/* Mobile Menu Button - Animated Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "lg:hidden relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300",
                isMobileMenuOpen ? "text-primary bg-primary/10" : "text-foreground hover:text-primary hover:bg-primary/10"
              )}
              aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="relative w-6 h-5 flex flex-col justify-between">
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? -45 : 0,
                    y: isMobileMenuOpen ? 8 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="block w-full h-0.5 bg-current rounded-full origin-center"
                />
                <motion.span
                  animate={{
                    opacity: isMobileMenuOpen ? 0 : 1,
                    scaleX: isMobileMenuOpen ? 0 : 1,
                  }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="block w-full h-0.5 bg-current rounded-full origin-center"
                />
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? 45 : 0,
                    y: isMobileMenuOpen ? -8 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="block w-full h-0.5 bg-current rounded-full origin-center"
                />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Menu - Full Screen Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-background/95 backdrop-blur-xl border-l border-primary/10 shadow-2xl flex flex-col"
            >
              <div className="flex flex-col h-full pt-20 pb-6 px-6">
                {/* Logo in menu */}
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="relative w-12 h-12">
                    <Image
                      src={LOGO_URL}
                      alt="Family Legends Logo"
                      fill
                      sizes="48px"
                      className="rounded-full object-cover"
                      priority
                    />
                  </div>
                  <span className="font-bold font-headline text-foreground text-lg">
                    {COMMUNITY_NAME}
                  </span>
                </div>

                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                  {navItems.map((item, index) => {
                    const isActive = activeSection === item.href;
                    return (
                      <motion.button
                        key={item.label}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
                        onClick={() => handleNavClick(item.href)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 min-h-[56px] text-right",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300",
                          isActive ? "bg-primary/20" : "bg-primary/5"
                        )}>
                          <item.icon className={cn(
                            "w-5 h-5",
                            isActive ? "text-primary" : "text-primary/70"
                          )} />
                        </div>
                        <span className="text-base font-medium">{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="mobileActiveIndicator"
                            className="mr-auto w-2 h-2 rounded-full bg-primary"
                          />
                        )}
                      </motion.button>
                    );
                  })}

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.08, duration: 0.4 }}
                    className="border-t border-border/50 mt-4 pt-4"
                  >
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsFilesOpen(true);
                      }}
                      className="flex items-center gap-4 px-4 py-4 rounded-xl text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-300 min-h-[56px] w-full text-right"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5">
                        <FileText className="w-5 h-5 text-primary/70" />
                      </div>
                      <span className="text-base font-medium">مكتبة المخطوطات</span>
                    </button>
                  </motion.div>
                </nav>

                {/* Mobile Login & Language */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-2"
                >
                  <div className="flex justify-center">
                    <LanguageSwitcher />
                  </div>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'lg' }),
                      'w-full flex items-center justify-center gap-2 min-h-[52px] border-primary/30 hover:border-primary/60 hover:bg-primary/5'
                    )}
                  >
                    <LogIn className="h-5 w-5" />
                    <span>{t('login')}</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FilesModal isOpen={isFilesOpen} onClose={() => setIsFilesOpen(false)} />
    </>
  );
}
