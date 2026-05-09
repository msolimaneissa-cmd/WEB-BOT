'use client';

import React, { useState } from 'react';
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from "@/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  User,
  ShieldCheck,
  Menu,
  Bell,
  RefreshCw,
  Search,
  ChevronDown,
  Home,
  Crown,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface AdminHeaderProps {
  onMenuToggle?: () => void;
  className?: string;
}

export function AdminHeader({ onMenuToggle, className }: AdminHeaderProps) {
  const t = useTranslations('Admin');
  const tc = useTranslations('Common');
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleLogout = async () => {
    if (confirm(tc('confirmLogout'))) {
      try {
        if (auth) {
          await auth.signOut();
        }
        await signOut({ redirect: false });
        router.push('/');
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  // Derive page title from pathname
  const getPageTitle = () => {
    if (pathname === '/admin') return t('pageTitle.home');
    if (pathname === '/admin/bot') return t('pageTitle.botStatus');
    if (pathname === '/admin/bot/settings') return t('pageTitle.serverSettings');
    if (pathname === '/admin/bot/settings/leaderboard') return t('pageTitle.leaderboard');
    return t('pageTitle.dashboard');
  };

  // Breadcrumb
  const getBreadcrumbs = () => {
    const crumbs: { label: string; href: string }[] = [{ label: t('breadcrumb.dashboard'), href: '/admin' }];
    if (pathname.startsWith('/admin/bot')) {
      crumbs.push({ label: t('breadcrumb.bot'), href: '/admin/bot' });
    }
    if (pathname.startsWith('/admin/bot/settings')) {
      crumbs.push({ label: t('breadcrumb.serverSettings'), href: '/admin/bot/settings' });
    }
    if (pathname.startsWith('/admin/bot/settings/leaderboard')) {
      crumbs.push({ label: t('breadcrumb.leaderboard'), href: pathname });
    }
    return crumbs;
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 w-full glass border-b border-white/5",
      className
    )}>
      {/* Decorative Glows from 529af version */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      
      <div className="flex items-center justify-between h-16 px-4 md:px-6 gap-4 relative z-10">
        {/* Left Section: Menu Toggle + Breadcrumbs */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 hover:bg-white/10 shrink-0"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <nav className="hidden sm:flex items-center gap-2 text-sm min-w-0 overflow-hidden" dir="rtl">
            {getBreadcrumbs().map((crumb, i, arr) => (
              <div key={crumb.href} className="flex items-center gap-2 shrink-0">
                {i > 0 && <span className="text-muted-foreground/40">/</span>}
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

          <h1 className="sm:hidden font-bold text-foreground truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Section: Quick Actions + User Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 border-r border-white/10 pr-3 ml-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-white/10"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
            
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/10 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-10 hover:bg-white/5">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {session?.user?.name?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start text-right">
                  <span className="text-sm font-bold text-foreground leading-tight">
                    {session?.user?.name || t('user.defaultName')}
                  </span>
                  <span className="text-[10px] text-primary font-black uppercase tracking-tighter">{t('user.adminPanel')}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden lg:block" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64 glass border-white/10 p-0" sideOffset={8}>
              <div className="p-4 border-b border-white/5 text-right">
                <div className="flex flex-row-reverse items-center gap-3">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session?.user?.name?.charAt(0) || <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                    <Badge variant="secondary" className="mt-1.5 text-[10px] bg-primary/10 text-primary border-0">
                      <Crown className="h-2.5 w-2.5 ml-1" />
                      {t('user.systemAdmin')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-1">
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-right justify-end">
                  <Link href="/" className="flex flex-row-reverse items-center gap-3 py-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{t('nav.mainSite')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-right justify-end">
                  <Link href="/admin/settings" className="flex flex-row-reverse items-center gap-3 py-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>{t('nav.settings')}</span>
                  </Link>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="bg-white/5" />

              <div className="p-1">
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg py-2 flex flex-row-reverse justify-end items-center gap-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
