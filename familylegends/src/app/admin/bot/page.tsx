'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSession, signIn } from "next-auth/react";
import { io, Socket } from 'socket.io-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  Server,
  Users,
  Clock,
  RefreshCw,
  Shield,
  Webhook,
  Eye,
  Zap,
  Activity,
  Save,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  Radio,
  Settings,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trophy,
  Activity as ActivityIcon,
  Archive,
  Star,
  TrendingUp,
  BarChart3,
  Sparkles,
  Crown,
  Flame,
  MessageSquare,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import type { Streamer } from '@/lib/data';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface BotStats {
  online?: boolean;
  database?: string;
  guildCount?: number;
  userCount?: number;
  uptime?: number;
  totalEconomy?: number;
  totalMessages?: number;
  message?: string;
  error?: string;
  lastSyncAttempt?: any;
}

interface BotConfig {
  webhookUrl: string;
  webhookSecret: string;
  updatedAt?: any;
}

interface DiscordActivityEntry {
  id: string;
  type: string;
  text: string;
  timestamp?: any;
  details?: string;
}

/* ──────────────────────────────────────────────
   Animated Number Counter
   ────────────────────────────────────────────── */

function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString('ar-EG'));
  
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} يوم`);
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  if (secs > 0 && parts.length === 0) parts.push(`${secs} ثانية`);
  return parts.join(' ، ') || '0 ثانية';
}

function formatTimestamp(timestamp: any): string {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function detectPlatformFromUrl(url: string): { name: string; color: string; bgColor: string } {
  if (!url) return { name: 'غير معروف', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  const u = url.toLowerCase();
  if (u.includes('kick.com')) return { name: 'Kick', color: 'text-[#53FC18]', bgColor: 'bg-[#53FC18]/10' };
  if (u.includes('twitch.tv')) return { name: 'Twitch', color: 'text-[#9146FF]', bgColor: 'bg-[#9146FF]/10' };
  if (u.includes('youtube.com') || u.includes('youtu.be')) return { name: 'YouTube', color: 'text-red-500', bgColor: 'bg-red-500/10' };
  if (u.includes('tiktok.com')) return { name: 'TikTok', color: 'text-white', bgColor: 'bg-white/10' };
  return { name: 'غير معروف', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
}

/* ──────────────────────────────────────────────
   Stat Card Component
   ────────────────────────────────────────────── */

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = 'primary',
  index = 0 
}: { 
  title: string; 
  value: string | number | React.ReactNode;
  icon: React.ElementType;
  trend?: string;
  color?: 'primary' | 'blue' | 'green' | 'purple' | 'amber';
  index?: number;
}) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/20 hover:border-primary/40',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20 hover:border-green-500/40',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
  };

  const iconColors = {
    primary: 'bg-primary/20 text-primary',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Card className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl border transition-all duration-500 group`}>
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl ${iconColors[color]} flex items-center justify-center shadow-lg`}>
              <Icon className="h-6 w-6" />
            </div>
            {trend && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                <TrendingUp className="h-3 w-3 ml-1" />
                {trend}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="text-3xl font-bold text-foreground">
            {value}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

export default function BotDashboardPage() {
  const { data: session, status } = useSession();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');

  const statsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'discord-stats') : null),
    [firestore]
  );
  const configDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'bot-config') : null),
    [firestore]
  );
  const streamersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'streamers'), orderBy('timestamp', 'desc'))
        : null,
    [firestore]
  );
  const activitiesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'discord-activities'), orderBy('timestamp', 'desc'))
        : null,
    [firestore]
  );

  const { data: statsData, isLoading: statsLoading } = useDoc<BotStats>(statsDocRef, false);
  const { data: configData, isLoading: configLoading } = useDoc<BotConfig>(configDocRef, false);
  const { data: streamers, isLoading: streamersLoading } = useCollection<Streamer>(streamersQuery, false);
  const { data: activities, isLoading: activitiesLoading } = useCollection<DiscordActivityEntry>(activitiesQuery, false);

  const stats = statsData as BotStats | null;
  const config = configData as BotConfig | null;

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [checkingStreamer, setCheckingStreamer] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_SERVER_URL || 'http://localhost:3001';
    setConnectionStatus('connecting');
    const socketInstance = io(botUrl, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to bot socket');
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    socketInstance.on('bot_activity', (data) => {
      toast({
        title: `⚡ نشاط جديد: ${data.text}`,
        description: data.details,
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [toast]);

  React.useEffect(() => {
    if (config) {
      setWebhookUrl(config.webhookUrl || '');
      setWebhookSecret(config.webhookSecret || '');
    }
  }, [config]);

  const saveConfig = useCallback(async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, webhookSecret }),
      });
      if (res.ok) {
        toast({ title: '✅ تم الحفظ', description: 'تم حفظ إعدادات الويب هوك بنجاح' });
      } else {
        const data = await res.json();
        toast({ title: '❌ خطأ', description: data.error || 'فشل في حفظ الإعدادات', variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ خطأ', description: 'فشل في الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setSavingConfig(false);
    }
  }, [webhookUrl, webhookSecret, toast]);

  const checkStreamerLive = useCallback(async (name: string) => {
    setCheckingStreamer(name);
    try {
      const res = await fetch(`/api/bot/check-streamer?name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        toast({
          title: data.isLive ? `🔴 ${name} متصل الآن` : `⭕ ${name} غير متصل`,
          description: `المنصة: ${data.platform} — تم الفحص بنجاح`,
        });
      } else {
        const data = await res.json();
        toast({ title: '❌ خطأ', description: data.error || 'فشل في فحص الستريمر', variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ خطأ', description: 'فشل في الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setCheckingStreamer(null);
    }
  }, [toast]);

  const deleteStreamer = useCallback(async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/bot/streamers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: '✅ تم الحذف', description: `تم حذف ${name} بنجاح` });
      } else {
        toast({ title: '❌ خطأ', description: 'فشل في حذف الستريمر', variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ خطأ', description: 'فشل في الاتصال بالخادم', variant: 'destructive' });
    }
  }, [toast]);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/bot/sync', { method: 'POST' });
      if (res.ok) {
        toast({ title: '✅ تم الإرسال', description: 'تم إرسال طلب المزامنة إلى البوت' });
      } else {
        toast({ title: '❌ خطأ', description: 'فشل في إرسال طلب المزامنة', variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ خطأ', description: 'فشل في الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  }, [toast]);

  const refreshStats = useCallback(async () => {
    setRefreshingStats(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshingStats(false);
  }, []);

  const isOnline = stats?.online ?? false;
  const liveCount = streamers?.filter(s => s.isLive).length || 0;

  const sortedStreamers = useMemo(() => {
    if (!streamers) return [];
    return [...streamers].sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return 0;
    });
  }, [streamers]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="h-12 w-12 text-primary" />
          </motion.div>
          <p className="text-muted-foreground animate-pulse text-lg">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="text-center relative">
              <motion.div 
                className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-4 border border-primary/20"
                animate={{ boxShadow: ['0 0 0 0 rgba(255, 215, 0, 0)', '0 0 0 20px rgba(255, 215, 0, 0)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="w-10 h-10 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-gradient-gold">لوحة تحكم البوت</CardTitle>
              <CardDescription className="text-base">يجب تسجيل الدخول عبر ديسكورد للوصول إلى إعدادات البوت</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <Button
                className="w-full h-14 text-lg font-bold gap-3 bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] shadow-lg shadow-[#5865F2]/20 transition-all duration-300"
                onClick={() => signIn("discord")}
              >
                <Activity className="w-6 h-6" />
                تسجيل الدخول عبر ديسكورد
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div 
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isOnline 
                  ? 'bg-gradient-to-br from-green-500/20 to-green-500/5' 
                  : 'bg-gradient-to-br from-red-500/20 to-red-500/5'
              } border ${isOnline ? 'border-green-500/30' : 'border-red-500/30'}`}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Server className={`h-8 w-8 ${isOnline ? 'text-green-400' : 'text-red-400'}`} />
            </motion.div>
            <motion.div 
              className={`absolute -top-1 -left-1 w-5 h-5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} border-2 border-background`}
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold text-gradient-gold">لوحة تحكم البوت</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? 'البوت متصل ويعمل' : 'البوت غير متصل'}
              </span>
              {stats?.uptime && (
                <Badge variant="outline" className="border-white/10 text-muted-foreground">
                  <Clock className="h-3 w-3 ml-1" />
                  {formatUptime(stats.uptime)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`gap-2 px-3 py-1.5 ${
              connectionStatus === 'connected' 
                ? 'border-green-500/30 text-green-400 bg-green-500/5' 
                : connectionStatus === 'connecting'
                ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'
                : 'border-red-500/30 text-red-400 bg-red-500/5'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            {connectionStatus === 'connected' ? 'متصل بالسوكيت' : 
             connectionStatus === 'connecting' ? 'جاري الاتصال...' : 'غير متصل'}
          </Badge>

          <Button
            onClick={refreshStats}
            variant="outline"
            size="sm"
            className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          >
            <RefreshCw className={`h-4 w-4 ${refreshingStats ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button
            onClick={triggerSync}
            variant="outline"
            size="sm"
            disabled={syncing}
            className="gap-2 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            مزامنة
          </Button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl w-fit backdrop-blur-sm border border-white/5"
      >
        {[
          { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
          { id: 'streamers', label: 'الستريمرز', icon: Radio },
          { id: 'config', label: 'الإعدادات', icon: Settings },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className={`gap-2 rounded-xl transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="عدد السيرفرات"
                value={statsLoading ? <Skeleton className="h-9 w-16" /> : <AnimatedNumber value={stats?.guildCount || 0} />}
                icon={Server}
                color="primary"
                index={0}
              />
              <StatCard
                title="المستخدمين"
                value={statsLoading ? <Skeleton className="h-9 w-20" /> : <AnimatedNumber value={stats?.userCount || 0} />}
                icon={Users}
                color="blue"
                index={1}
              />
              <StatCard
                title="الستريمرز النشطين"
                value={statsLoading ? <Skeleton className="h-9 w-12" /> : <AnimatedNumber value={liveCount} />}
                icon={Radio}
                color="green"
                trend="مباشر"
                index={2}
              />
              <StatCard
                title="مدة التشغيل"
                value={statsLoading ? <Skeleton className="h-9 w-24" /> : (stats?.uptime ? formatUptime(stats.uptime) : '—')}
                icon={Clock}
                color="purple"
                index={3}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="lg:col-span-2"
              >
                <Card className="glass-card h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/20">
                        <ActivityIcon className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">سجل النشاط</CardTitle>
                        <CardDescription>آخر الأنشطة من ديسكورد</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-amber-500/20 text-amber-400">
                      <Bell className="h-3 w-3 ml-1" />
                      مباشر
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {activitiesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-white/[0.02]">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activities && activities.length > 0 ? (
                      <div className="relative max-h-[500px] overflow-y-auto custom-scrollbar space-y-2">
                        {activities.slice(0, 10).map((entry, idx) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all duration-300"
                          >
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                <Sparkles className="h-5 w-5 text-primary" />
                              </div>
                              <div className="absolute w-2 h-2 rounded-full bg-primary top-0 left-0 animate-ping opacity-75" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-relaxed text-foreground">
                                {entry.text}
                                {entry.details && (
                                  <span className="text-muted-foreground mr-2">— {entry.details}</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTimestamp(entry.timestamp)}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <ActivityIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        </motion.div>
                        <p className="text-muted-foreground text-lg">لا توجد أنشطة حتى الآن</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Card className="glass-card h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">إحصائيات سريعة</CardTitle>
                        <CardDescription>نظرة عامة على الأداء</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">قاعدة البيانات</span>
                        <span className={`font-medium ${stats?.database === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                          {stats?.database === 'connected' ? 'متصل' : 'غير متصل'}
                        </span>
                      </div>
                      <Progress value={stats?.database === 'connected' ? 100 : 0} className="h-2" />
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">الاقتصاد</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-400">
                        {stats?.totalEconomy?.toLocaleString('ar-EG') || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">إجمالي العملات</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="h-5 w-5 text-blue-400" />
                        <span className="text-sm text-muted-foreground">الرسائل</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-400">
                        {stats?.totalMessages?.toLocaleString('ar-EG') || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">إجمالي الرسائل</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Flame className="h-5 w-5 text-red-400" />
                          <span className="text-sm text-muted-foreground">يبث الآن</span>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-3 h-3 rounded-full bg-red-500"
                        />
                      </div>
                      <p className="text-2xl font-bold text-red-400">{liveCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">ستريمر نشط</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'streamers' && (
          <motion.div
            key="streamers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card overflow-hidden">
              <CardHeader className="bg-gradient-to-l from-red-500/10 to-transparent border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center border border-red-500/20">
                      <Radio className="h-7 w-7 text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">إدارة الستريمرز</CardTitle>
                      <CardDescription>مراقبة وإدارة حالة الستريمرز</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/5 px-4 py-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500 ml-2 animate-pulse" />
                      {liveCount} مباشر
                    </Badge>
                    <Badge variant="outline" className="border-white/10 text-muted-foreground px-4 py-2 text-sm">
                      {streamers?.length || 0} إجمالي
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {streamersLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : sortedStreamers && sortedStreamers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent bg-white/[0.02]">
                          <TableHead className="text-right font-medium">الستريمر</TableHead>
                          <TableHead className="text-right font-medium">الدور</TableHead>
                          <TableHead className="text-right font-medium">المنصة</TableHead>
                          <TableHead className="text-center font-medium">الحالة</TableHead>
                          <TableHead className="text-right font-medium">آخر فحص</TableHead>
                          <TableHead className="text-center font-medium">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedStreamers.map((streamer, idx) => {
                          const platform = detectPlatformFromUrl(streamer.channelLink || '');
                          const isCheckingThis = checkingStreamer === streamer.name;

                          return (
                            <motion.tr
                              key={streamer.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="border-white/5 hover:bg-white/[0.02] transition-colors group"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {streamer.imageUrl ? (
                                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary/30 transition-colors">
                                        <img
                                          src={streamer.imageUrl}
                                          alt={streamer.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center">
                                        <Radio className="h-5 w-5 text-primary" />
                                      </div>
                                    )}
                                    {streamer.isLive && (
                                      <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-semibold">{streamer.name}</span>
                                    {streamer.isLive && (
                                      <Badge className="mr-2 bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                        مباشر
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {streamer.role || '—'}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${platform.bgColor} ${platform.color} border-0 font-medium`}>
                                  {platform.name}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {streamer.isLive ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className="w-3 h-3 rounded-full bg-red-500"
                                    />
                                    <span className="text-red-400 font-medium">مباشر</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <XCircle className="h-4 w-4" />
                                    <span>غير متصل</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatTimestamp((streamer as any).lastLiveCheck)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => checkStreamerLive(streamer.name)}
                                    disabled={isCheckingThis}
                                    title="فحص الحالة"
                                  >
                                    {isCheckingThis ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <a
                                    href={streamer.channelLink || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-400"
                                      title="زيارة القناة"
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                  </a>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => deleteStreamer(streamer.id, streamer.name)}
                                    title="حذف"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Radio className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-muted-foreground text-lg">لا يوجد ستريمرز حالياً</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card max-w-2xl">
              <CardHeader className="bg-gradient-to-l from-purple-500/10 to-transparent border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center border border-purple-500/20">
                    <Webhook className="h-7 w-7 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">إعدادات الويب هوك</CardTitle>
                    <CardDescription>تهيئة رابط الويب هوك للإشعارات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {configLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-12 w-32 rounded-xl" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="webhookUrl" className="text-sm text-muted-foreground flex items-center gap-2">
                        <Webhook className="h-4 w-4" />
                        رابط الويب هوك
                      </Label>
                      <Input
                        id="webhookUrl"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="font-mono text-sm bg-white/5 border-white/10 focus:border-primary/50 h-12 rounded-xl"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="webhookSecret" className="text-sm text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        مفتاح سري
                      </Label>
                      <Input
                        id="webhookSecret"
                        type="password"
                        placeholder="••••••••"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        className="font-mono text-sm bg-white/5 border-white/10 focus:border-primary/50 h-12 rounded-xl"
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground/60 flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        يُستخدم للتحقق من هوية الطلبات الواردة
                      </p>
                    </div>

                    <Separator className="bg-white/5" />

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {config?.updatedAt ? (
                          <span>آخر تحديث: {formatTimestamp(config.updatedAt)}</span>
                        ) : (
                          'لم يتم الحفظ بعد'
                        )}
                      </div>
                      <Button
                        onClick={saveConfig}
                        disabled={savingConfig}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-xl shadow-lg shadow-primary/20"
                      >
                        {savingConfig ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        حفظ الإعدادات
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stats?.error && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <Card className="glass-card border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-destructive">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  </motion.div>
                  <p className="text-sm font-medium">{stats.error}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
