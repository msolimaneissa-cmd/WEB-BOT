'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Trophy, 
  ArrowRight, 
  Medal, 
  Star, 
  TrendingUp, 
  MessageSquare,
  Search,
  Loader2,
  Crown,
  Flame,
  Zap,
  Award,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */

interface LeaderboardMember {
  userId: string;
  username?: string;
  avatar?: string;
  level: number;
  xp: number;
  totalMessages: number;
  badges?: { name: string; emoji: string }[];
}

/* ──────────────────────────────────────────────
   Animated Number
────────────────────────────────────────────── */

function AnimatedValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <>{display.toLocaleString('ar-EG')}</>;
}

/* ──────────────────────────────────────────────
   Top 3 Card Component
────────────────────────────────────────────── */

function TopPlayerCard({ member, rank }: { member: LeaderboardMember; rank: 0 | 1 | 2 }) {
  const rankStyles = [
    {
      border: 'border-t-4 border-t-yellow-500',
      bg: 'from-yellow-500/20 via-yellow-500/10 to-transparent',
      icon: Crown,
      iconColor: 'text-yellow-400',
      glow: 'shadow-yellow-500/20',
      label: 'المركز الأول',
      scale: 'scale-105 z-10',
    },
    {
      border: 'border-t-4 border-t-slate-300',
      bg: 'from-slate-300/20 via-slate-300/10 to-transparent',
      icon: Medal,
      iconColor: 'text-slate-300',
      glow: 'shadow-slate-300/10',
      label: 'المركز الثاني',
      scale: '',
    },
    {
      border: 'border-t-4 border-t-amber-600',
      bg: 'from-amber-600/20 via-amber-600/10 to-transparent',
      icon: Award,
      iconColor: 'text-amber-600',
      glow: 'shadow-amber-600/10',
      label: 'المركز الثالث',
      scale: '',
    },
  ];

  const style = rankStyles[rank];
  const IconComponent = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: rank * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={style.scale}
    >
      <Card className={`glass-card relative overflow-hidden ${style.border} shadow-xl ${style.glow} group`}>
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${style.bg} pointer-events-none`} />
        
        {/* Decorative trophy */}
        <div className="absolute -left-8 -top-8 opacity-5">
          <Trophy className="h-32 w-32" />
        </div>

        {/* Rank badge */}
        <div className="absolute top-4 left-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: rank * 0.3 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${style.iconColor} bg-white/5 border border-white/10`}
          >
            <IconComponent className="h-5 w-5" />
          </motion.div>
        </div>

        <CardContent className="p-6 text-center relative">
          {/* Avatar */}
          <div className="relative mx-auto mb-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/10 flex items-center justify-center mx-auto overflow-hidden"
            >
              {member.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${member.userId}/${member.avatar}.png?size=128`}
                  alt={member.username || member.userId}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="h-8 w-8 text-muted-foreground" />
              )}
            </motion.div>
            {rank === 0 && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-dashed border-yellow-500/30"
              />
            )}
          </div>

          {/* Name */}
          <h3 className="font-bold text-lg truncate mb-1" title={member.userId}>
            {member.username || member.userId}
          </h3>
          
          {/* Level badge */}
          <Badge variant="outline" className={`mb-3 border-0 ${style.iconColor} bg-white/5`}>
            <Zap className="h-3 w-3 ml-1" />
            المستوى {member.level}
          </Badge>

          {/* XP */}
          <div className="space-y-1">
            <p className={`text-3xl font-bold ${style.iconColor}`}>
              <AnimatedValue value={member.xp} />
            </p>
            <p className="text-xs text-muted-foreground">نقطة خبرة</p>
          </div>

          {/* Messages */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">{member.totalMessages?.toLocaleString('ar-EG') || 0} رسالة</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Leaderboard Row Component
────────────────────────────────────────────── */

function LeaderboardRow({ member, rank, index }: { member: LeaderboardMember; rank: number; index: number }) {
  const getRankDisplay = () => {
    if (rank === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (rank === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return (
      <span className="font-mono text-lg text-muted-foreground w-8 text-center">
        #{rank + 1}
      </span>
    );
  };

  const isTop3 = rank < 3;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`border-white/5 hover:bg-white/[0.02] transition-colors group ${
        isTop3 ? 'bg-primary/5' : ''
      }`}
    >
      <TableCell className="py-4">
        <div className="flex items-center justify-center">
          {getRankDisplay()}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
            isTop3 ? 'from-primary/20 to-primary/5 border-primary/20' : 'from-white/10 to-white/5 border-white/10'
          } border flex items-center justify-center overflow-hidden`}>
            {member.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${member.userId}/${member.avatar}.png?size=64`}
                alt={member.username || member.userId}
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <span className="font-medium">{member.username || member.userId}</span>
            {isTop3 && (
              <Badge variant="outline" className="mr-2 border-primary/20 text-primary text-xs">
                <Sparkles className="h-3 w-3 ml-1" />
                مميز
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          <Zap className="h-3 w-3 ml-1" />
          {member.level}
        </Badge>
      </TableCell>
      <TableCell className="font-bold text-lg">
        {member.xp?.toLocaleString('ar-EG')}
      </TableCell>
      <TableCell className="text-muted-foreground">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {member.totalMessages?.toLocaleString('ar-EG')}
        </div>
      </TableCell>
      <TableCell className="text-left">
        <div className="flex flex-wrap gap-1 justify-end">
          {member.badges?.slice(0, 5).map((b, i) => (
            <motion.span
              key={i}
              title={b.name}
              className="text-lg"
              whileHover={{ scale: 1.2 }}
            >
              {b.emoji}
            </motion.span>
          ))}
        </div>
      </TableCell>
    </motion.tr>
  );
}

/* ──────────────────────────────────────────────
   Mobile Card Component
────────────────────────────────────────────── */

function MobileMemberCard({ member, rank, index }: { member: LeaderboardMember; rank: number; index: number }) {
  const rankStyles = [
    { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20' },
    { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20' },
    { icon: null, color: 'text-muted-foreground', bg: 'bg-white/5', border: 'border-white/10' },
  ];

  const style = rank < 3 ? rankStyles[rank] : rankStyles[3];
  const IconComponent = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`glass-card ${style.border} ${rank < 3 ? 'bg-primary/5' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Rank */}
            <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center`}>
              {IconComponent ? (
                <IconComponent className={`h-6 w-6 ${style.color}`} />
              ) : (
                <span className={`font-bold text-lg ${style.color}`}>#{rank + 1}</span>
              )}
            </div>

            {/* Avatar + Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                {member.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${member.userId}/${member.avatar}.png?size=64`}
                    alt={member.username || member.userId}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{member.username || member.userId}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="h-5 text-xs bg-transparent">
                    Lv.{member.level}
                  </Badge>
                  <span>{member.xp?.toLocaleString('ar-EG')} XP</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="text-left">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span className="text-sm">{member.totalMessages?.toLocaleString('ar-EG')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bot/members`);
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.members || []).sort((a: LeaderboardMember, b: LeaderboardMember) => {
          if (a.level !== b.level) return b.level - a.level;
          return b.xp - a.xp;
        });
        setMembers(sorted);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(m => 
      m.userId.toLowerCase().includes(query) ||
      (m.username && m.username.toLowerCase().includes(query))
    );
  }, [members, searchQuery]);

  // Paginated members (excluding top 3)
  const top3 = filteredMembers.slice(0, 3);
  const restMembers = filteredMembers.slice(3);
  const totalPages = Math.ceil(restMembers.length / itemsPerPage);
  const paginatedMembers = restMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto"
          >
            <Trophy className="h-12 w-12 text-primary" />
          </motion.div>
          <p className="text-muted-foreground text-xl animate-pulse">جار تحميل لوحة المتصدرين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8 min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="flex items-center gap-4">
          <Button 
            asChild 
            variant="ghost" 
            className="h-12 w-12 rounded-xl"
          >
            <Link href={`/admin/bot/settings`}>
              <ArrowRight className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl lg:text-4xl font-headline font-bold text-gradient-gold">
                لوحة المتصدرين
              </h1>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-3 py-1">
                <Users className="h-3 w-3 ml-1" />
                {members.length}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">عرض ترتيب الأعضاء حسب التفاعل والمستوى</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="بحث عن عضو..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pr-12 bg-white/5 border-white/10 h-12 rounded-xl focus:border-primary/50"
          />
        </div>
      </motion.div>

      {/* Top 3 Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {top3.map((member, i) => (
            <TopPlayerCard key={member.userId} member={member} rank={i as 0 | 1 | 2} />
          ))}
        </div>
      )}

      {/* Leaderboard Table/Card List */}
      {filteredMembers.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">الترتيب الكامل</CardTitle>
                  <CardDescription>جميع الأعضاء المرتبين حسب المستوى والخبرة</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-20 text-center font-medium">المركز</TableHead>
                      <TableHead className="font-medium">العضو</TableHead>
                      <TableHead className="font-medium">المستوى</TableHead>
                      <TableHead className="font-medium">إجمالي XP</TableHead>
                      <TableHead className="font-medium">الرسائل</TableHead>
                      <TableHead className="text-left font-medium">الأوسمة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member, idx) => (
                      <LeaderboardRow 
                        key={member.userId} 
                        member={member} 
                        rank={3 + (currentPage - 1) * itemsPerPage + idx}
                        index={idx}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden space-y-3 p-4">
                {paginatedMembers.map((member, idx) => (
                  <MobileMemberCard
                    key={member.userId}
                    member={member}
                    rank={3 + (currentPage - 1) * itemsPerPage + idx}
                    index={idx}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-10 w-10 rounded-xl"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                          className={`h-10 w-10 rounded-xl ${
                            currentPage === page 
                              ? 'bg-primary text-primary-foreground' 
                              : 'border-white/10'
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="glass-card">
            <CardContent className="py-20 text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="font-headline text-2xl font-bold text-foreground mb-3">
                {searchQuery ? 'لا توجد نتائج' : 'لا يوجد أعضاء'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery 
                  ? `لم يتم العثور على أعضاء يطابقون "${searchQuery}"`
                  : 'لم يتم تسجيل أي أعضاء في لوحة المتصدرين بعد'
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results summary */}
      {searchQuery && filteredMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground text-sm"
        >
          عرض {filteredMembers.length} من {members.length} عضو
        </motion.div>
      )}
    </div>
  );
}
