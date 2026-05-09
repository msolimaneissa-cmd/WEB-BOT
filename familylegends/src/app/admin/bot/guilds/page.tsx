'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession, signIn } from "next-auth/react";
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
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Server,
  Users,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  Shield,
  Loader2,
  Search,
  SortAsc,
  SortDesc,
  Settings,
  Crown,
  Sparkles,
  HandHeart,
  ShieldAlert,
  Music,
  Coins,
  Frown,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */

interface GuildData {
  guildId: string;
  name?: string;
  icon?: string;
  mod: { modRoleId: string; adminRoleId: string; maxWarnings: number; autoBan: boolean };
  welcome: { enabled: boolean; channelId: string };
  antiSpam: { enabled: boolean };
  antiLink: { enabled: boolean };
  economy: { enabled: boolean; currencyName: string; currencyEmoji: string };
  music: { defaultVolume: number };
  memberCount: number;
}

type SortOption = 'name' | 'members';
type SortDirection = 'asc' | 'desc';

/* ──────────────────────────────────────────────
   Guild Card Component
────────────────────────────────────────────── */

function GuildCard({ guild, index }: { guild: GuildData; index: number }) {
  const enabledFeatures = [
    guild.welcome?.enabled && { name: 'ترحيب', icon: HandHeart, color: 'green' },
    guild.antiSpam?.enabled && { name: 'حماية', icon: ShieldAlert, color: 'red' },
    guild.economy?.enabled && { name: 'اقتصاد', icon: Coins, color: 'yellow' },
    guild.music?.defaultVolume !== 80 && { name: 'موسيقى', icon: Music, color: 'purple' },
  ].filter(Boolean) as { name: string; icon: React.ElementType; color: string }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Card className="group glass-card relative overflow-hidden hover:border-primary/40 transition-all duration-500">
        {/* Background decoration */}
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
        
        <CardContent className="p-6 relative">
          {/* Guild Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                {guild.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${guild.guildId}/${guild.icon}.png?size=64`}
                    alt={guild.name || guild.guildId}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <Server className="h-7 w-7 text-primary" />
                )}
              </div>
              <motion.div
                className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background"
                whileHover={{ scale: 1.1 }}
              >
                <Crown className="h-2.5 w-2.5 text-primary-foreground" />
              </motion.div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg truncate" title={guild.guildId}>
                {guild.name || guild.guildId}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {guild.memberCount?.toLocaleString('ar-EG') || 0} عضو
                </span>
              </div>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {enabledFeatures.length > 0 ? (
              enabledFeatures.map((feature, i) => {
                const colorMap: Record<string, string> = {
                  green: 'border-green-500/30 text-green-400 bg-green-500/10',
                  red: 'border-red-500/30 text-red-400 bg-red-500/10',
                  yellow: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
                  purple: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
                };
                return (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-xs gap-1.5 px-2.5 py-1 ${colorMap[feature.color]}`}
                  >
                    <feature.icon className="h-3 w-3" />
                    {feature.name}
                  </Badge>
                );
              })
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground/50 border-white/5">
                لا توجد ميزات مفعلة
              </Badge>
            )}
          </div>

          {/* Configuration Status */}
          <div className="mb-5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">حالة الإعداد</span>
              <span className={`font-medium ${
                enabledFeatures.length >= 3 ? 'text-green-400' : 
                enabledFeatures.length >= 1 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {enabledFeatures.length >= 3 ? 'مكتمل' : 
                 enabledFeatures.length >= 1 ? 'جزئي' : 'غير مُعد'}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  enabledFeatures.length >= 3 ? 'bg-green-500' : 
                  enabledFeatures.length >= 1 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${(enabledFeatures.length / 4) * 100}%` }}
                transition={{ delay: index * 0.08 + 0.3, duration: 0.5 }}
              />
            </div>
          </div>

          {/* Action Button */}
          <Link href={`/admin/bot/guilds/${guild.guildId}`} className="block">
            <Button
              variant="outline"
              className="w-full gap-2 h-12 rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10"
            >
              <Settings className="h-4 w-4" />
              إدارة السيرفر
              <ChevronLeft className="h-4 w-4 mr-auto" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Component
────────────────────────────────────────────── */

export default function BotGuildsPage() {
  const { data: session, status } = useSession();
  const [guilds, setGuilds] = useState<GuildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('members');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  const fetchGuilds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bot/guilds');
      const data = await res.json();
      setGuilds(data.guilds || []);
    } catch {
      setGuilds([]);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل السيرفرات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (session) fetchGuilds();
  }, [fetchGuilds, session]);

  // Filtered and sorted guilds
  const filteredGuilds = useMemo(() => {
    let result = [...guilds];
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.guildId.toLowerCase().includes(query) ||
        (g.name && g.name.toLowerCase().includes(query))
      );
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortOption === 'name') {
        const aName = a.name || a.guildId;
        const bName = b.name || b.guildId;
        return sortDirection === 'asc' 
          ? aName.localeCompare(bName, 'ar')
          : bName.localeCompare(aName, 'ar');
      } else {
        return sortDirection === 'asc' 
          ? (a.memberCount || 0) - (b.memberCount || 0)
          : (b.memberCount || 0) - (a.memberCount || 0);
      }
    });
    
    return result;
  }, [guilds, searchQuery, sortOption, sortDirection]);

  /* ─── Authentication ─── */
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
              <CardTitle className="text-2xl font-bold text-gradient-gold">إدارة السيرفرات</CardTitle>
              <CardDescription className="text-base">يجب تسجيل الدخول عبر ديسكورد للوصول إلى قائمة السيرفرات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <Button
                className="w-full h-14 text-lg font-bold gap-3 bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] shadow-lg shadow-[#5865F2]/20 transition-all duration-300"
                onClick={() => signIn("discord")}
              >
                <Server className="w-6 h-6" />
                تسجيل الدخول عبر ديسكورد
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto"
          >
            <Server className="h-10 w-10 text-primary" />
          </motion.div>
          <p className="text-muted-foreground text-xl">جار تحميل السيرفرات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ═══════════════════════════════════════════
          Header
      ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <Link href="/admin/bot">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary h-12 w-12 rounded-xl"
            >
              <ArrowRight className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold text-gradient-gold">
                إدارة السيرفرات
              </h1>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-4 py-1.5 text-sm">
                {guilds.length} سيرفر
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">جميع السيرفرات التي يستخدم فيها البوت</p>
          </div>
        </div>

        <Button
          onClick={fetchGuilds}
          variant="outline"
          className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 h-12 px-6 rounded-xl"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث القائمة
        </Button>
      </motion.div>

      {/* ═══════════════════════════════════════════
          Search & Filter Bar
      ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="بحث عن سيرفر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-12 bg-white/5 border-white/10 h-12 rounded-xl focus:border-primary/50 text-base"
          />
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <Select value={sortOption} onValueChange={(v: SortOption) => setSortOption(v)}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 h-12 rounded-xl">
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="members">عدد الأعضاء</SelectItem>
              <SelectItem value="name">الاسم</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="w-12 h-12 rounded-xl border-white/10 hover:bg-white/5"
          >
            {sortDirection === 'asc' ? (
              <SortAsc className="h-5 w-5" />
            ) : (
              <SortDesc className="h-5 w-5" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          Guild Cards Grid
      ═══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {filteredGuilds.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="glass-card">
              <CardContent className="py-20 px-8 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {searchQuery ? (
                    <Search className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
                  ) : (
                    <Frown className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
                  )}
                </motion.div>
                <h3 className="font-headline text-2xl font-bold text-foreground mb-3">
                  {searchQuery ? 'لا توجد نتائج' : 'لا توجد سيرفرات'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                  {searchQuery 
                    ? `لم يتم العثور على سيرفرات تطابق "${searchQuery}"`
                    : 'البوت لم ينضم لأي سيرفر بعد'
                  }
                </p>
                {!searchQuery && (
                  <p className="text-sm text-muted-foreground/60 max-w-md mx-auto">
                    تأكد من إضافة البوت لسيرفرك باستخدام رابط الدعوة
                  </p>
                )}
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="mt-6 gap-2 rounded-xl"
                  >
                    مسح البحث
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredGuilds.map((guild, index) => (
              <GuildCard key={guild.guildId} guild={guild} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      {searchQuery && filteredGuilds.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground text-sm"
        >
          عرض {filteredGuilds.length} من {guilds.length} سيرفر
        </motion.div>
      )}
    </div>
  );
}
