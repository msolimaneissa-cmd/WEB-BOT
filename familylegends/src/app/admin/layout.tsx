'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from 'react';
import { useAuth } from '@/firebase';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Bot, Server, LogOut, Menu, X, Loader2,
  Shield, ChevronLeft, User, Home, Bell, RefreshCw, Search,
  ChevronDown, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_URL = "/images/logo.png";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'عام',
    links: [
      { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'البوت',
    links: [
      { href: '/admin/bot', label: 'حالة البوت', icon: Bot, exact: true },
      { href: '/admin/bot/settings', label: 'إدارة السيرفر', icon: Server, exact: false },
    ],
  },
];

const sidebarVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 200,
    }
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 200,
    }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const navItemVariants = {
  initial: { opacity: 0, x: 20 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  }),
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const pageTransitionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const auth = useAuth();

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      try {
        if (auth) {
          await auth.signOut();
        }
        await signOut({ callbackUrl: '/' });
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const getPageTitle = () => {
    if (pathname === '/admin') return 'الرئيسية';
    if (pathname === '/admin/bot') return 'حالة البوت';
    if (pathname === '/admin/bot/settings') return 'إدارة السيرفر';
    return 'لوحة القيادة';
  };

  const getBreadcrumbs = () => {
    const crumbs: { label: string; href: string }[] = [{ label: 'لوحة القيادة', href: '/admin' }];
    if (pathname.startsWith('/admin/bot')) {
      crumbs.push({ label: 'البوت', href: '/admin/bot' });
    }
    if (pathname.startsWith('/admin/bot/settings')) {
      crumbs.push({ label: 'إدارة السيرفر', href: '/admin/bot/settings' });
    }
    return crumbs;
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground animate-pulse"
          >
            جاري التحقق من الصلاحيات...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <>{children}</>;
  }

  const ADMIN_IDS = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
  if (ADMIN_IDS.length === 0 || !session.user?.id || !ADMIN_IDS.includes(session.user.id)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto border border-destructive/20">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-destructive text-xl font-bold">غير مصرح لك بالوصول</p>
            <p className="text-muted-foreground text-sm">ليس لديك صلاحيات المدير للوصول إلى هذه الصفحة</p>
          </div>
          <Button variant="outline" onClick={() => signOut()} className="gap-2">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground" dir="rtl">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={sidebarOpen ? 'visible' : 'hidden'}
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-[260px] bg-card/80 backdrop-blur-xl border-l border-white/10 flex flex-col',
          'md:translate-x-0 md:relative md:block'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden"
            >
              <Image
                src={LOGO_URL}
                alt="Logo"
                width={32}
                height={32}
                className="rounded object-cover"
                priority
              />
            </motion.div>
            <div>
              <h1 className="font-bold text-lg text-gradient-gold">لوحة القيادة</h1>
              <p className="text-[10px] text-muted-foreground">نظام الإدارة المتقدم</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {sidebarSections.map((section, sectionIndex) => (
            <div key={section.title}>
              <motion.h3 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
                className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-3 px-3"
              >
                {section.title}
              </motion.h3>
              <div className="space-y-1">
                {section.links.map((link, linkIndex) => {
                  const isActive = link.exact
                    ? pathname === link.href
                    : pathname === link.href || pathname.startsWith(link.href + '/');
                  const Icon = link.icon;
                  const itemIndex = sectionIndex * 10 + linkIndex;

                  return (
                    <motion.div
                      key={link.href}
                      custom={itemIndex}
                      variants={navItemVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                          isActive
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        
                        <Icon className={cn('h-4 w-4 transition-colors', isActive && 'text-primary')} />
                        <span className="relative z-10">{link.label}</span>
                        
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mr-auto"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                          </motion.div>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <Separator className="bg-white/5" />

        <div className="p-3 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-xl bg-white/5 border border-white/5"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={session.user?.image || ''} alt={session.user?.name || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {session.user?.name?.charAt(0) || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user?.name || 'المستخدم'}
                </p>
                <Badge 
                  variant="secondary" 
                  className="mt-1 text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0"
                >
                  <Crown className="h-2.5 w-2.5 ml-1" />
                  مدير
                </Badge>
              </div>
            </div>
          </motion.div>

          <div className="space-y-1">
            <Link href="/">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-10 text-sm"
              >
                <Home className="h-4 w-4" />
                <span>الموقع الرئيسي</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-10 text-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-30 h-16 glass border-b border-white/5 flex items-center px-4 md:px-6 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 hover:bg-white/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <nav className="flex-1 flex items-center gap-2 text-sm min-w-0 overflow-hidden">
            {getBreadcrumbs().map((crumb, i, arr) => (
              <div key={crumb.href} className="flex items-center gap-2 shrink-0">
                {i > 0 && (
                  <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
                {i === arr.length - 1 ? (
                  <span className="font-bold text-foreground">{crumb.label}</span>
                ) : (
                  <Link 
                    href={crumb.href} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="hidden md:flex items-center relative max-w-xs">
            <Search className="absolute right-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="البحث..."
              className="pr-10 h-9 w-[200px] bg-white/5 border-white/10 focus:border-primary/30"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-white/10"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-white/10 relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-primary rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 py-1.5 h-9 hover:bg-white/5"
                >
                  <Avatar className="h-7 w-7 border border-primary/20">
                    <AvatarImage src={session.user?.image || ''} alt={session.user?.name || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {session.user?.name?.charAt(0) || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-white/10">
                <div className="flex items-center gap-3 p-3 border-b border-white/5">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarImage src={session.user?.image || ''} alt={session.user?.name || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session.user?.name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    الموقع الرئيسي
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <motion.div
            key={pathname}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-7xl mx-auto"
          >
            <div className="mb-6">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-bold text-gradient-gold"
              >
                {getPageTitle()}
              </motion.h1>
            </div>
            
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
