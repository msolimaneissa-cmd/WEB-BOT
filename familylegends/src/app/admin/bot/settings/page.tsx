'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { io, Socket } from 'socket.io-client';
import { 
  Medal, 
  Loader2,
  RefreshCw,
  MessageSquare,
  Shield,
  DollarSign,
  Music,
  Users,
  Trophy,
  Ticket as TicketIcon,
  Archive,
  Zap,
  Reply,
  Bell,
  Layout,
  Radio,
  AlertOctagon,
  Activity as ActivityIcon,
  ArrowRight,
  Plus,
  RotateCcw,
  Star,
  Edit,
  Trash2,
  X,
  Gavel,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

// Tab Components
import { TabsOverview } from '@/components/admin/guild-tabs/tabs-overview';
import { TabsMod } from '@/components/admin/guild-tabs/tabs-mod';
import { TabsWelcome } from '@/components/admin/guild-tabs/tabs-welcome';
import { TabsProtection } from '@/components/admin/guild-tabs/tabs-protection';
import { TabsEconomy } from '@/components/admin/guild-tabs/tabs-economy';
import { TabsMusic } from '@/components/admin/guild-tabs/tabs-music';
import { TabsLevels } from '@/components/admin/guild-tabs/tabs-levels';
import { TabsAI } from '@/components/admin/guild-tabs/tabs-ai';
import { TabsLogs } from '@/components/admin/guild-tabs/tabs-logs';
import { TabsGiveaways } from '@/components/admin/guild-tabs/tabs-giveaways';
import { TabsBackups } from '@/components/admin/guild-tabs/tabs-backups';
import { TabsRR } from '@/components/admin/guild-tabs/tabs-rr';
import { TabsResponder } from '@/components/admin/guild-tabs/tabs-responder';
import { TabsNotifications } from '@/components/admin/guild-tabs/tabs-notifications';
import { TabsEmbed } from '@/components/admin/guild-tabs/tabs-embed';
import { TabsMembers } from '@/components/admin/guild-tabs/tabs-members';
import { TabsTickets } from '@/components/admin/guild-tabs/tabs-tickets';
import { TabsVerify } from '@/components/admin/guild-tabs/tabs-verify';
import { TabsRules } from '@/components/admin/guild-tabs/tabs-rules';
import { TabsServices } from '@/components/admin/guild-tabs/tabs-services';
import { TabsStatus } from '@/components/admin/guild-tabs/tabs-status';

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
interface ProtectionAntiSpam {
  enabled: boolean;
  maxMessages: number;
  interval: number;
  punishment: 'timeout' | 'kick' | 'ban';
}

interface ProtectionAntiLink {
  enabled: boolean;
  allowedChannels: string[];
  allowedRoles: string[];
}

interface ProtectionConfig {
  antiSpam: ProtectionAntiSpam;
  antiLink: ProtectionAntiLink;
  antiInvite: { enabled: boolean };
  antiCaps: { enabled: boolean; minCapsPercentage: number; minCapsLength: number };
  antiSwear: { enabled: boolean; customWords: string[] };
}

interface MemberData {
  userId: string;
  balance: number;
  bank: number;
  level: number;
  xp: number;
  totalMessages: number;
  badges: any[];
}

/* ──────────────────────────────────────────────
   Default Configs
────────────────────────────────────────────── */
const defaultProtection: ProtectionConfig = {
  antiSpam: { enabled: false, maxMessages: 5, interval: 5000, punishment: 'timeout' },
  antiLink: { enabled: false, allowedChannels: [], allowedRoles: [] },
  antiInvite: { enabled: false },
  antiCaps: { enabled: false, minCapsPercentage: 70, minCapsLength: 5 },
  antiSwear: { enabled: false, customWords: [] },
};

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
export default function GuildDetailPage() {
  const { data: session } = useSession();
  const guildId = process.env.NEXT_PUBLIC_GUILD_ID || '1314275005888204850';
  const { toast } = useToast();

  // State: Data
  // ... rest of states ...
  const [settings, setSettings] = useState<any>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [warningStats, setWarningStats] = useState<any>(null);
  const [guildStats, setGuildStats] = useState<any>(null);
  const [botHealth, setBotHealth] = useState<any>(null);
  const [responders, setResponders] = useState<any[]>([]);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [reactionRoles, setReactionRoles] = useState<any[]>([]);
  
  // State: UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  // State: Dialogs
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<MemberData | null>(null);
  const [editBalance, setEditBalance] = useState(0);
  const [editBank, setEditBank] = useState(0);
  const [editLevel, setEditLevel] = useState(0);
  const [savingMember, setSavingMember] = useState(false);

  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetMember, setResetMember] = useState<MemberData | null>(null);
  const [resettingMember, setResettingMember] = useState(false);

  const [isBadgesDialogOpen, setIsBadgesDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newBadgeId, setNewBadgeId] = useState('');
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeEmoji, setNewBadgeEmoji] = useState('⭐');
  const [awardingBadge, setAwardingBadge] = useState(false);

  // State: Modules Sub-states
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newExact, setNewExact] = useState(false);
  const [addingResponder, setAddingResponder] = useState(false);

  const [newStreamerName, setNewStreamerName] = useState('');
  const [newStreamerUsername, setNewStreamerUsername] = useState('');
  const [newStreamerPlatform, setNewStreamerPlatform] = useState('twitch');
  const [addingStreamer, setAddingStreamer] = useState(false);
  const [streamDetection, setStreamDetection] = useState({ enabled: false, channelId: '', checkInterval: 60 });

  const [embedChannelId, setEmbedChannelId] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [embedContent, setEmbedContent] = useState('');
  const [embedColor, setEmbedColor] = useState('#5865F2');
  const [sendingEmbed, setSendingEmbed] = useState(false);

  const [newRRChannel, setNewRRChannel] = useState('');
  const [newRRTitle, setNewRRTitle] = useState('');
  const [newRRDesc, setNewRRDesc] = useState('');
  const [newRRRoles, setNewRRRoles] = useState<any[]>([]);
  const [creatingRR, setCreatingRR] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  /* ─── Socket.io Connection ─── */
  useEffect(() => {
    if (!guildId) return;
    const botUrl = process.env.NEXT_PUBLIC_BOT_SERVER_URL || 'http://localhost:3001';
    const socketInstance = io(botUrl);
    
    socketInstance.on('connect', () => {
      console.log('Connected to bot socket from guild page');
    });

    socketInstance.on('bot_health', (data) => {
      setBotHealth(data);
    });

    socketInstance.on('new_audit_log', (log) => {
      if (log.guildId === guildId) {
        setLogs((prev) => [log, ...prev].slice(0, 50));
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [guildId]);

  /* ─── Helpers ─── */
  const getProtection = useCallback((): any => {
    if (settings?.protection) {
      return {
        antiSpam: { ...defaultProtection.antiSpam, ...settings.protection.antiSpam },
        antiLink: { ...defaultProtection.antiLink, ...settings.protection.antiLink },
        antiInvite: { ...defaultProtection.antiInvite, ...settings.protection.antiInvite },
        antiCaps: { ...defaultProtection.antiCaps, ...settings.protection.antiCaps },
        antiSwear: { ...defaultProtection.antiSwear, ...settings.protection.antiSwear },
        antiMention: { enabled: false, maxMentions: 5, action: 'timeout', ...settings.protection.antiMention },
        antiNuke: { enabled: false, maxChannelDelete: 3, maxRoleDelete: 3, maxKick: 5, maxBan: 5, action: 'quarantine', ...settings.protection.antiNuke },
        verification: { enabled: false, roleId: '', channelId: '', message: 'اضغط على الزر بالأسفل للتحقق والدخول للسيرفر.', ...settings.protection.verification },
      };
    }
    return { ...defaultProtection };
  }, [settings]);

  const truncateId = (id: string) => id ? `${id.slice(0, 6)}...${id.slice(-4)}` : '---';
  const formatDate = (date: string) => new Date(date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });

  /* ─── Fetch Data ─── */
  const fetchData = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const [settingsRes, membersRes, economyRes, shopRes, warningsRes, statsRes, responderRes, notifyRes, healthRes, rrRes, backupRes, logsRes, giveawayRes] = await Promise.all([
        fetch(`/api/bot/guilds/${guildId}/settings`),
        fetch(`/api/bot/guilds/${guildId}/members`),
        fetch(`/api/bot/guilds/${guildId}/economy`),
        fetch(`/api/bot/guilds/${guildId}/shop`),
        fetch(`/api/bot/guilds/${guildId}/warnings`).catch(() => null),
        fetch(`/api/bot/guilds/${guildId}/stats`).catch(() => null),
        fetch(`/api/bot/guilds/${guildId}/auto-responder`).catch(() => null),
        fetch(`/api/bot/guilds/${guildId}/notifications`).catch(() => null),
        fetch(`/api/bot/health`).catch(() => null),
        fetch(`/api/bot/guilds/${guildId}/reaction-roles`).catch(() => null),
        fetch(`/api/bot/guilds/${guildId}/backups`).catch(() => null),
        fetch(`/api/bot/guilds/${guildId}/logs?limit=20`).catch(() => null),
        fetch(`/api/bot/giveaways?ended=false`).catch(() => null),
      ]);

      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (membersRes?.ok) {
        const mData = await membersRes.json();
        setMembers(mData.members || []);
      }
      
      if (warningsRes?.ok) setWarningStats(await warningsRes.json());
      if (statsRes?.ok) {
        const sData = await statsRes.json();
        setGuildStats(sData.stats);
      }
      
      if (responderRes?.ok) {
        const rData = await responderRes.json();
        setResponders(rData.responders || []);
      }

      if (notifyRes?.ok) {
        const nData = await notifyRes.json();
        setStreamers(nData.streamers || []);
        setStreamDetection(nData.streamDetection || { enabled: false, channelId: '', checkInterval: 60 });
      }

      if (healthRes?.ok) setBotHealth(await healthRes.json());
      if (rrRes?.ok) {
        const rrData = await rrRes.json();
        setReactionRoles(rrData.reactionRoles || []);
      }
      if (backupRes?.ok) {
        const bData = await backupRes.json();
        setBackups(bData.backups || []);
      }
      if (logsRes?.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }
      if (giveawayRes?.ok) {
        const gData = await giveawayRes.json();
        setGiveaways(gData.giveaways || []);
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  }, [guildId, toast, session]);

  useEffect(() => {
    if (session) fetchData();
  }, [fetchData, session]);

  /* ─── Save Settings ─── */
  const saveSettings = async (section: string, extraData?: Record<string, unknown>) => {
    if (!settings) return;
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      updateData[section] = settings[section];
      if (extraData) Object.assign(updateData, extraData);

      const res = await fetch(`/api/bot/guilds/${guildId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) toast({ title: 'تم الحفظ', description: 'تم حفظ الإعدادات بنجاح' });
      else throw new Error('Save failed');
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  const saveProtection = async () => {
    if (!settings) return;
    const prot = getProtection();
    setSaving(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protection: prot }),
      });
      if (res.ok) toast({ title: 'تم الحفظ', description: 'تم حفظ إعدادات الحماية بنجاح' });
      else throw new Error('Save failed');
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في حفظ إعدادات الحماية' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: string, field: string, value: unknown) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  /* ─── Module Specific Actions ─── */
  const handleAddResponder = async () => {
    if (!newTrigger || !newResponse) return;
    setAddingResponder(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/auto-responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: newTrigger, response: newResponse, exact: newExact }),
      });
      if (res.ok) {
        toast({ title: 'تمت الإضافة', description: 'تم إضافة الرد التلقائي بنجاح' });
        setNewTrigger(''); setNewResponse(''); setNewExact(false);
        fetchData();
      }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الإضافة' }); }
    finally { setAddingResponder(false); }
  };

  const handleDeleteResponder = async (trigger: string) => {
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/auto-responder?trigger=${encodeURIComponent(trigger)}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'تم الحذف', description: 'تم حذف الرد التلقائي' }); fetchData(); }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحذف' }); }
  };

  const handleAddStreamer = async () => {
    if (!newStreamerName || !newStreamerUsername) return;
    setAddingStreamer(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamer: { name: newStreamerName, platform: newStreamerPlatform, username: newStreamerUsername } }),
      });
      if (res.ok) { toast({ title: 'تمت الإضافة', description: 'تم إضافة الستريمر بنجاح' }); fetchData(); }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الإضافة' }); }
    finally { setAddingStreamer(false); }
  };

  const handleDeleteStreamer = async (username: string, platform: string) => {
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/notifications?username=${username}&platform=${platform}`, { method: 'DELETE' });
      if (res.ok) { fetchData(); }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحذف' }); }
  };

  const handleSendEmbed = async () => {
    if (!embedChannelId || !embedTitle) return;
    setSendingEmbed(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: embedChannelId, content: embedContent, embed: { title: embedTitle, description: embedDescription, color: parseInt(embedColor.replace('#', ''), 16) } }),
      });
      if (res.ok) toast({ title: 'تم الإرسال', description: 'تم إرسال الـ Embed بنجاح!' });
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الإرسال' }); }
    finally { setSendingEmbed(false); }
  };

  const handleCreateRR = async () => {
    if (!newRRChannel || !newRRTitle || newRRRoles.length === 0) return;
    setCreatingRR(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/reaction-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: newRRChannel, title: newRRTitle, description: newRRDesc, roles: newRRRoles }),
      });
      if (res.ok) { fetchData(); }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الإرسال' }); }
    finally { setCreatingRR(false); }
  };

  const handleAddRRRole = () => {
    setNewRRRoles((prev) => [...prev, { roleId: '', emoji: '', label: '' }]);
  };

  const saveStreamDetection = async () => {
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamDetection }),
      });
      if (res.ok) toast({ title: 'تم الحفظ', description: 'تم حفظ إعدادات التنبيهات' });
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحفظ' }); }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/backups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creatorId: 'Dashboard Admin' }) });
      if (res.ok) toast({ title: 'تم البدء', description: 'جاري إنشاء النسخة الاحتياطية' });
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الإنشاء' }); }
    finally { setCreatingBackup(false); }
  };

  /* ─── Member Dialog Actions ─── */
  const openEditDialog = (member: MemberData) => {
    setEditMember(member); setEditBalance(member.balance); setEditBank(member.bank); setEditLevel(member.level); setEditDialogOpen(true);
  };

  const handleSaveMember = async () => {
    if (!editMember) return;
    setSavingMember(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/members/${editMember.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: editBalance, bank: editBank, level: editLevel }),
      });
      if (res.ok) { setEditDialogOpen(false); fetchData(); }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في التحديث' }); }
    finally { setSavingMember(false); }
  };

  const openResetDialog = (member: MemberData) => {
    setResetMember(member); setResetDialogOpen(true);
  };

  const handleResetMember = async () => {
    if (!resetMember) return;
    setResettingMember(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/members/${resetMember.userId}`, { method: 'DELETE' });
      if (res.ok) { setResetDialogOpen(false); fetchData(); }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إعادة التعيين' }); }
    finally { setResettingMember(false); }
  };

  const openBadgesDialog = (member: any) => {
    setSelectedMember(member); setIsBadgesDialogOpen(true);
  };

  const handleAwardBadge = async () => {
    if (!selectedMember || !newBadgeId || !newBadgeName) return;
    setAwardingBadge(true);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/members/${selectedMember.userId}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId: newBadgeId, name: newBadgeName, emoji: newBadgeEmoji }),
      });
      if (res.ok) { setIsBadgesDialogOpen(false); fetchData(); }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في منح الوسام' }); }
    finally { setAwardingBadge(false); }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground text-lg">لم يتم العثور على بيانات السيرفر</p>
        <Button asChild variant="outline">
          <Link href="/admin/bot/settings">العودة للوحة التحكم</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-8 min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link href="/admin/bot"><ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-3xl lg:text-4xl font-headline text-primary glow-primary">
              إدارة السيرفر
            </h1>
          </div>
          <p className="text-muted-foreground mr-12">تحكم كامل في إعدادات وأعضاء السيرفر: <span className="text-primary font-mono">{guildId}</span></p>
        </div>
        <div className="flex gap-3 mr-auto md:mr-0">
          <Button variant="outline" onClick={fetchData} className="gap-2 h-11 border-primary/20 hover:bg-primary/10">
            <RefreshCw className="h-4 w-4" /> تحديث البيانات
          </Button>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Tabs List */}
      <Tabs defaultValue="status" className="w-full" dir="rtl">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-white/5 p-1 rounded-xl justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="status" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <ActivityIcon className="h-4 w-4" /> الحالة
          </TabsTrigger>
          <TabsTrigger value="welcome" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <MessageSquare className="h-4 w-4" /> الترحيب
          </TabsTrigger>
          <TabsTrigger value="protection" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Shield className="h-4 w-4" /> الحماية
          </TabsTrigger>
          <TabsTrigger value="economy" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <DollarSign className="h-4 w-4" /> الاقتصاد
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Medal className="h-4 w-4" /> المستويات
          </TabsTrigger>
          <TabsTrigger value="music" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Music className="h-4 w-4" /> الموسيقى
          </TabsTrigger>
          <TabsTrigger value="responder" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Reply className="h-4 w-4" /> الردود
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Bell className="h-4 w-4" /> الإشعارات
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Layout className="h-4 w-4" /> Embed
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Users className="h-4 w-4" /> الأعضاء
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Radio className="h-4 w-4" /> الذكاء الاصطناعي
          </TabsTrigger>
          <TabsTrigger value="giveaways" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Trophy className="h-4 w-4" /> الهبات
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Archive className="h-4 w-4" /> السجلات
          </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Archive className="h-4 w-4" /> النسخ
          </TabsTrigger>
          <TabsTrigger value="reaction-roles" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Zap className="h-4 w-4" /> الرتب
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <TicketIcon className="h-4 w-4" /> التذاكر
          </TabsTrigger>
          <TabsTrigger value="verify" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <ShieldCheck className="h-4 w-4" /> التحقق
          </TabsTrigger>
          <TabsTrigger value="rules-manage" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Gavel className="h-4 w-4" /> القوانين
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <Zap className="h-4 w-4" /> الخدمات
          </TabsTrigger>
          <TabsTrigger value="bot-status" className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2">
            <ActivityIcon className="h-4 w-4" /> حالة البوت
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <TabsOverview stats={guildStats} botHealth={botHealth} members={members} fetchData={fetchData} guildId={guildId} />
        </TabsContent>

        <TabsContent value="welcome">
          <TabsWelcome settings={settings} updateField={updateField} saveSettings={saveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="protection">
          <TabsProtection settings={settings} updateField={updateField} saveSettings={saveProtection} saving={saving} getProtection={getProtection} />
        </TabsContent>

        <TabsContent value="economy">
          <TabsEconomy settings={settings} updateField={updateField} saveSettings={saveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="levels">
          <TabsLevels settings={settings} updateField={updateField} saveSettings={saveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="music">
          <TabsMusic settings={settings} updateField={updateField} saveSettings={saveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="responder">
          <TabsResponder 
            responders={responders} newTrigger={newTrigger} setNewTrigger={setNewTrigger}
            newResponse={newResponse} setNewResponse={setNewResponse}
            newExact={newExact} setNewExact={setNewExact}
            handleAddResponder={handleAddResponder} handleDeleteResponder={handleDeleteResponder}
            addingResponder={addingResponder}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <TabsNotifications 
            streamers={streamers} newStreamerName={newStreamerName} setNewStreamerName={setNewStreamerName}
            newStreamerUsername={newStreamerUsername} setNewStreamerUsername={setNewStreamerUsername}
            newStreamerPlatform={newStreamerPlatform} setNewStreamerPlatform={setNewStreamerPlatform}
            handleAddStreamer={handleAddStreamer} handleDeleteStreamer={handleDeleteStreamer}
            addingStreamer={addingStreamer} streamDetection={streamDetection}
            setStreamDetection={setStreamDetection} saveStreamDetection={saveStreamDetection}
            settings={settings} updateField={updateField} saveSettings={saveSettings}
          />
        </TabsContent>

        <TabsContent value="embed">
          <TabsEmbed 
            embedChannelId={embedChannelId} setEmbedChannelId={setEmbedChannelId}
            embedTitle={embedTitle} setEmbedTitle={setEmbedTitle}
            embedDescription={embedDescription} setEmbedDescription={setEmbedDescription}
            embedContent={embedContent} setEmbedContent={setEmbedContent}
            embedColor={embedColor} setEmbedColor={setEmbedColor}
            handleSendEmbed={handleSendEmbed} sendingEmbed={sendingEmbed}
          />
        </TabsContent>

        <TabsContent value="members">
          <TabsMembers 
            members={members} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            openEditDialog={openEditDialog} openResetDialog={openResetDialog}
            openBadgesDialog={openBadgesDialog} truncateId={truncateId}
          />
        </TabsContent>

        <TabsContent value="ai">
          <TabsAI settings={settings} updateField={updateField} saveSettings={saveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="logs">
          <TabsLogs 
            logs={logs} 
            fetchData={fetchData} 
            truncateId={truncateId} 
            formatDate={formatDate}
            settings={settings}
            updateField={updateField}
            saveSettings={saveSettings}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="giveaways">
          <TabsGiveaways giveaways={giveaways} formatDate={formatDate} />
        </TabsContent>

        <TabsContent value="backups">
          <TabsBackups backups={backups} creatingBackup={creatingBackup} handleCreateBackup={handleCreateBackup} formatDate={formatDate} />
        </TabsContent>

        <TabsContent value="reaction-roles">
          <TabsRR 
            newRRChannel={newRRChannel} setNewRRChannel={setNewRRChannel}
            newRRTitle={newRRTitle} setNewRRTitle={setNewRRTitle}
            newRRDesc={newRRDesc} setNewRRDesc={setNewRRDesc}
            newRRRoles={newRRRoles} setNewRRRoles={setNewRRRoles}
            handleAddRRRole={handleAddRRRole} handleCreateRR={handleCreateRR}
            creatingRR={creatingRR}
          />
        </TabsContent>

        <TabsContent value="tickets">
          <TabsTickets settings={settings} updateField={updateField} saveSettings={saveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="verify">
          <TabsVerify settings={settings} updateField={updateField} saveSettings={saveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="rules-manage">
          <TabsRules guildId={guildId} />
        </TabsContent>

        <TabsContent value="services">
          <TabsServices settings={settings} updateField={updateField} saveSettings={saveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="bot-status">
          <TabsStatus botHealth={botHealth} stats={guildStats} fetchData={fetchData} />
        </TabsContent>
      </Tabs>

      {/* ──────────────────────────────────────────────
          Dialogs (Global)
      ────────────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader><DialogTitle>تعديل بيانات العضو</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>الرصيد</Label><Input type="number" value={editBalance} onChange={(e) => setEditBalance(parseInt(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>البنك</Label><Input type="number" value={editBank} onChange={(e) => setEditBank(parseInt(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>المستوى</Label><Input type="number" value={editLevel} onChange={(e) => setEditLevel(parseInt(e.target.value) || 0)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditDialogOpen(false)}>إلغاء</Button><Button onClick={handleSaveMember} disabled={savingMember}>{savingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التعديلات'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader><DialogTitle className="text-destructive">إعادة تعيين بيانات العضو</DialogTitle><DialogDescription>هل أنت متأكد؟ سيتم تصفير الرصيد والمستوى نهائياً.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setResetDialogOpen(false)}>إلغاء</Button><Button variant="destructive" onClick={handleResetMember} disabled={resettingMember}>{resettingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد الحذف'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBadgesDialogOpen} onOpenChange={setIsBadgesDialogOpen}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader><DialogTitle>منح وسام للعضو</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>معرف الوسام</Label><Input value={newBadgeId} onChange={(e) => setNewBadgeId(e.target.value)} placeholder="active_user" /></div>
            <div className="space-y-2"><Label>اسم الوسام</Label><Input value={newBadgeName} onChange={(e) => setNewBadgeName(e.target.value)} placeholder="عضو نشط" /></div>
            <div className="space-y-2"><Label>الرمز (Emoji)</Label><Input value={newBadgeEmoji} onChange={(e) => setNewBadgeEmoji(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsBadgesDialogOpen(false)}>إلغاء</Button><Button onClick={handleAwardBadge} disabled={awardingBadge}>{awardingBadge ? <Loader2 className="h-4 w-4 animate-spin" /> : 'منح الوسام'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
