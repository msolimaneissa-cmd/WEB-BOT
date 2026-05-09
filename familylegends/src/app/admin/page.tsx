'use client';

import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import {
  ShieldCheck, Loader2, Settings, Handshake, Library, Gavel, Users,
  Clapperboard, Music, Gamepad2, FileText, Plus, Pencil, Trash2,
  ExternalLink, Link2, Sparkles, Bell, RefreshCw, Activity, MessageSquare,
  FolderOpen
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import type { CommunitySettings, Rule, TeamMember, Streamer, AudioTrack } from "@/lib/data";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  CardsSkeleton, EmptyState, ItemCard, getTabConfig, fadeInUp, staggerContainer,
  fileIcons
} from "@/components/admin/admin-ui";
import { AdminDialogs } from "@/components/admin/admin-dialogs";
import { useTranslations } from 'next-intl';

type Partner = {
  id: string;
  name: string;
  inviteUrl: string;
  logoUrl: string;
  description: string;
  timestamp: string;
  ownerName?: string;
  ownerUrl?: string;
  streamUrl?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    twitch?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
  };
};
type FileItem = { id: string; fileName: string; fileUrl: string; iconClass: string; timestamp: string };
type ItemType = 'partner' | 'file' | 'rule' | 'teamMember' | 'streamer' | 'audioTrack';

export default function AdminPage() {
  const t = useTranslations('Admin');
  const { data: session, status } = useSession();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [dialogs, setDialogs] = useState({ partner: false, file: false, rule: false, teamMember: false, streamer: false, audioTrack: false });
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: ItemType } | null>(null);
  const [botHealth, setBotHealth] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('settings');

  const [currentPartner, setCurrentPartner] = useState<Partial<Partner> | null>(null);
  const [currentFile, setCurrentFile] = useState<Partial<FileItem> | null>(null);
  const [currentRule, setCurrentRule] = useState<Partial<Rule> | null>(null);
  const [currentTeamMember, setCurrentTeamMember] = useState<Partial<TeamMember> | null>(null);
  const [currentStreamer, setCurrentStreamer] = useState<Partial<Streamer> | null>(null);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<Partial<AudioTrack> | null>(null);

  // Firestore collections
  const partnersCollection = useMemoFirebase(() => firestore ? query(collection(firestore, "partners"), orderBy("timestamp", "desc")) : null, [firestore]);
  const { data: partners, isLoading: partnersLoading } = useCollection<Partner>(partnersCollection);

  const filesCollection = useMemoFirebase(() => firestore ? query(collection(firestore, "files"), orderBy("timestamp", "desc")) : null, [firestore]);
  const { data: files, isLoading: filesLoading } = useCollection<FileItem>(filesCollection);

  const rulesCollection = useMemoFirebase(() => firestore ? query(collection(firestore, "rules"), orderBy("timestamp", "desc")) : null, [firestore]);
  const { data: rules, isLoading: rulesLoading } = useCollection<Rule>(rulesCollection);

  const teamCollection = useMemoFirebase(() => firestore ? query(collection(firestore, "team"), orderBy("timestamp", "desc")) : null, [firestore]);
  const { data: teamMembers, isLoading: teamLoading } = useCollection<TeamMember>(teamCollection);

  const streamersCollection = useMemoFirebase(() => firestore ? query(collection(firestore, "streamers"), orderBy("timestamp", "desc")) : null, [firestore]);
  const { data: streamers, isLoading: streamersLoading } = useCollection<Streamer>(streamersCollection);

  const audioTracksCollection = useMemoFirebase(() => firestore ? query(collection(firestore, "audioTracks"), orderBy("timestamp", "desc")) : null, [firestore]);
  const { data: audioTracks, isLoading: audioTracksLoading } = useCollection<AudioTrack>(audioTracksCollection);

  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'community') : null, [firestore]);
  const { data: communitySettings, isLoading: settingsLoading } = useDoc<CommunitySettings>(settingsDocRef);
  const [currentSettings, setCurrentSettings] = useState<Partial<CommunitySettings>>({});

  useEffect(() => {
    const fetchBotHealth = async () => {
      try {
        const res = await fetch('/api/bot/health');
        if (res.ok) {
          const data = await res.json();
          setBotHealth(data);
        }
      } catch (e) {
        console.warn('Bot health endpoint not available');
      }
    };
    fetchBotHealth();
  }, []);

  useEffect(() => {
    if (!settingsLoading && communitySettings) {
      setCurrentSettings(communitySettings);
    }
  }, [communitySettings, settingsLoading]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20" />
            <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground animate-pulse font-bold">جاري التحقق من الصلاحيات...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="w-full max-w-md glass border-primary/20 p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-gradient-gold">لوحة الإدارة</h2>
              <p className="text-muted-foreground">يجب تسجيل الدخول عبر ديسكورد للوصول إلى لوحة التحكم</p>
              <Button
                className="w-full h-12 text-lg font-bold gap-3 bg-[#5865F2] hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/20 rounded-xl mt-4"
                onClick={() => signIn("discord")}
              >
                <MessageSquare className="w-5 h-5" />
                تسجيل الدخول عبر ديسكورد
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const openDialog = (type: keyof typeof dialogs, data: any = null) => {
    const initialData = {
      partner: { name: '', inviteUrl: '', logoUrl: '', description: '', ownerName: '', ownerUrl: '', streamUrl: '', socialLinks: { twitter: '', discord: '', twitch: '', youtube: '', instagram: '', facebook: '' } },
      file: { fileName: '', fileUrl: '', iconClass: 'File' },
      rule: { title: '', description: '' },
      teamMember: { name: '', role: '', imageUrl: '', socialLinks: { twitter: '', discord: '', twitch: '', youtube: '', instagram: '', facebook: '' } },
      streamer: { name: '', role: '', imageUrl: '', channelLink: '#', isLive: false, socialLinks: { twitter: '', discord: '', twitch: '', youtube: '', instagram: '', facebook: '' } },
      audioTrack: { title: '', url: '', type: 'music', artist: '' },
    };
    if (type === 'partner') setCurrentPartner(data || initialData.partner);
    if (type === 'file') setCurrentFile(data || initialData.file);
    if (type === 'rule') setCurrentRule(data || initialData.rule);
    if (type === 'teamMember') setCurrentTeamMember(data || initialData.teamMember);
    if (type === 'streamer') setCurrentStreamer(data || initialData.streamer);
    if (type === 'audioTrack') setCurrentAudioTrack(data || initialData.audioTrack);
    setDialogs(prev => ({ ...prev, [type]: true }));
  };

  const closeDialog = (type: keyof typeof dialogs) => {
    setDialogs(prev => ({ ...prev, [type]: false }));
  };

  const handleSave = async (type: ItemType, currentItem: any) => {
    if (!currentItem || !firestore) return;
    const collectionName = type === 'teamMember' ? 'team' : type === 'audioTrack' ? 'audioTracks' : `${type}s`;
    const docId = currentItem.id || doc(collection(firestore, collectionName)).id;
    const docRef = doc(firestore, collectionName, docId);
    
    const { id, ...saveData } = currentItem;
    await setDocumentNonBlocking(docRef, { ...saveData, timestamp: new Date().toISOString() }, { merge: true });
    
    toast({ title: 'تم الحفظ', description: 'تم تحديث البيانات بنجاح' });
    setDialogs(prev => ({ ...prev, [type]: false }));
  };

  const confirmDelete = (id: string, type: ItemType) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete || !firestore) return;
    const collectionName = itemToDelete.type === 'teamMember' ? 'team' : itemToDelete.type === 'audioTrack' ? 'audioTracks' : `${itemToDelete.type}s`;
    const docRef = doc(firestore, collectionName, itemToDelete.id);
    await deleteDocumentNonBlocking(docRef);
    toast({ title: 'تم الحذف', description: 'تم حذف العنصر بنجاح' });
    setDeleteDialogOpen(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    if (!firestore || !settingsDocRef) return;
    try {
      await setDocumentNonBlocking(settingsDocRef, currentSettings, { merge: true });
      toast({ title: "✅ تم الحفظ", description: "تم تحديث إعدادات المجتمع بنجاح" });
    } catch (error) {
      toast({ title: "❌ خطأ", description: "فشل في حفظ الإعدادات", variant: "destructive" });
    }
  };

  const syncStreamersToBot = async () => {
    try {
      const res = await fetch('/api/bot/sync', { method: 'POST' });
      if (res.ok) {
        toast({ title: "✅ تم الإرسال", description: "تم إرسال طلب المزامنة إلى البوت" });
      } else {
        toast({ title: "❌ خطأ", description: "فشل في إرسال طلب المزامنة", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "❌ خطأ", description: "فشل في الاتصال بالخادم", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-foreground" dir="rtl">
      <AdminHeader />
      
      <main className="container mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-500">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="glass-card p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">أعضاء الفريق</p>
                <p className="text-2xl font-black text-white">{teamMembers?.length || 0}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Handshake className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">الحلفاء</p>
                <p className="text-2xl font-black text-white">{partners?.length || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.2 }} className="glass-card p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Clapperboard className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">الستريمرز</p>
                <p className="text-2xl font-black text-white">{streamers?.length || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.3 }} className="glass-card p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">حالة البوت</p>
                <p className={cn("text-lg font-bold", botHealth?.status === 'online' ? "text-green-400" : "text-red-400")}>
                  {botHealth?.status === 'online' ? 'يعمل' : 'متوقف'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="settings" onValueChange={setActiveTab} className="space-y-6">
          <div className="sticky top-[72px] z-20 bg-[#050505]/80 backdrop-blur-md p-1 rounded-2xl border border-white/5">
            <TabsList className="bg-transparent h-12 w-full justify-start overflow-x-auto overflow-y-hidden no-scrollbar gap-1 px-1">
              {getTabConfig(t).map((tab) => (
                <TabsTrigger
                  key={tab.type}
                  value={tab.type}
                  className={cn(
                    "rounded-xl px-6 h-10 gap-2 font-bold transition-all shrink-0",
                    "data-[state=active]:bg-primary data-[state=active]:text-black"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Settings Tab */}
              <TabsContent value="settings" className="m-0">
                <Card className="glass border-white/5 overflow-hidden rounded-3xl">
                  <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Settings className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black">إعدادات المجتمع</CardTitle>
                        <CardDescription>التحكم في المعلومات الأساسية للموقع والروابط الاجتماعية</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    {settingsLoading ? <Skeleton className="h-[400px] w-full rounded-2xl" /> : (
                      <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(e); }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label className="text-white font-bold text-base">اسم المجتمع</Label>
                          <Input 
                            value={currentSettings.name || ''} 
                            onChange={e => setCurrentSettings({...currentSettings, name: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-white font-bold text-base">رابط الشعار (URL)</Label>
                          <Input 
                            value={currentSettings.logoUrl || ''} 
                            onChange={e => setCurrentSettings({...currentSettings, logoUrl: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all ltr"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-white font-bold text-base">رابط دعوة ديسكورد</Label>
                          <Input 
                            value={currentSettings.discordInviteLink || ''} 
                            onChange={e => setCurrentSettings({...currentSettings, discordInviteLink: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all ltr"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-white font-bold text-base">حقوق النشر</Label>
                          <Input 
                            value={currentSettings.copyright || ''} 
                            onChange={e => setCurrentSettings({...currentSettings, copyright: e.target.value})}
                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2 flex justify-end pt-4">
                          <Button type="submit" className="bg-primary text-black hover:bg-primary/90 rounded-xl px-12 h-12 font-black text-lg transition-all shadow-lg hover:shadow-primary/30">
                            حفظ الإعدادات
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Partners Tab */}
              <TabsContent value="partner" className="m-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">إدارة الحلفاء</h3>
                  <Button onClick={() => openDialog('partner')} className="bg-primary text-black font-bold rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> إضافة حليف
                  </Button>
                </div>
                {partnersLoading ? <CardsSkeleton /> : partners?.length === 0 ? (
                  <EmptyState icon={Handshake} title="لا يوجد حلفاء" description="أضف شركاءك لعرضهم في صفحة الحلفاء." onAdd={() => openDialog('partner')} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partners?.map((p, i) => (
                      <ItemCard key={p.id} onEdit={() => openDialog('partner', p)} onDelete={() => confirmDelete(p.id, 'partner')} delay={i * 0.05}>
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden shrink-0 border border-white/10">
                            <img src={p.logoUrl} className="w-full h-full object-cover" alt={p.name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-white truncate">{p.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                          </div>
                        </div>
                      </ItemCard>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="teamMember" className="m-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">إدارة فريق الإدارة</h3>
                  <Button onClick={() => openDialog('teamMember')} className="bg-primary text-black font-bold rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> إضافة مسؤول
                  </Button>
                </div>
                {teamLoading ? <CardsSkeleton /> : teamMembers?.length === 0 ? (
                  <EmptyState icon={Users} title="لا يوجد أعضاء" description="أضف فريق عمل المجتمع." onAdd={() => openDialog('teamMember')} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {teamMembers?.map((m, i) => (
                      <ItemCard key={m.id} onEdit={() => openDialog('teamMember', m)} onDelete={() => confirmDelete(m.id, 'teamMember')} delay={i * 0.05}>
                        <div className="flex flex-col items-center text-center">
                          <div className="w-20 h-20 rounded-full border-2 border-primary/20 overflow-hidden mb-4 p-1">
                            <img src={m.imageUrl} className="w-full h-full object-cover rounded-full" alt={m.name} />
                          </div>
                          <h4 className="font-black text-white">{m.name}</h4>
                          <Badge className="mt-2 bg-primary/10 text-primary border-0">{m.role}</Badge>
                        </div>
                      </ItemCard>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="rule" className="m-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">إدارة قوانين السيرفر</h3>
                  <Button onClick={() => openDialog('rule')} className="bg-primary text-black font-bold rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> إضافة قانون
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {rules?.map((r, i) => (
                    <ItemCard key={r.id} onEdit={() => openDialog('rule', r)} onDelete={() => confirmDelete(r.id, 'rule')} delay={i * 0.05}>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                          <Gavel className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-black text-white">{r.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.description}</p>
                        </div>
                      </div>
                    </ItemCard>
                  ))}
                </div>
              </TabsContent>

              {/* Streamers Tab */}
              <TabsContent value="streamer" className="m-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">إدارة الستريمرز</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={syncStreamersToBot} className="border-white/10 hover:bg-white/5 font-bold rounded-xl gap-2">
                      <RefreshCw className="w-4 h-4" /> مزامنة مع البوت
                    </Button>
                    <Button onClick={() => openDialog('streamer')} className="bg-primary text-black font-bold rounded-xl gap-2">
                      <Plus className="w-4 h-4" /> إضافة ستريمر
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {streamers?.map((s, i) => (
                    <ItemCard key={s.id} onEdit={() => openDialog('streamer', s)} onDelete={() => confirmDelete(s.id, 'streamer')} delay={i * 0.05}>
                      <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full border-2 border-purple-500/20 overflow-hidden mb-4 relative">
                          <img src={s.imageUrl} className="w-full h-full object-cover" alt={s.name} />
                          {s.isLive && (
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                          )}
                        </div>
                        <h4 className="font-black text-white">{s.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{s.role}</p>
                      </div>
                    </ItemCard>
                  ))}
                </div>
              </TabsContent>

              {/* Audio Tracks Tab */}
              <TabsContent value="audioTrack" className="m-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">إدارة المكتبة الصوتية</h3>
                  <Button onClick={() => openDialog('audioTrack')} className="bg-primary text-black font-bold rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> إضافة مقطع
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {audioTracks?.map((a, i) => (
                    <ItemCard key={a.id} onEdit={() => openDialog('audioTrack', a)} onDelete={() => confirmDelete(a.id, 'audioTrack')} delay={i * 0.05}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                          <Music className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-white truncate">{a.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{a.artist || 'Unkown'}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">{a.type}</Badge>
                      </div>
                    </ItemCard>
                  ))}
                </div>
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="file" className="m-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">إدارة المخطوطات والملفات</h3>
                  <Button onClick={() => openDialog('file')} className="bg-primary text-black font-bold rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> إضافة ملف
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files?.map((f, i) => (
                    <ItemCard key={f.id} onEdit={() => openDialog('file', f)} onDelete={() => confirmDelete(f.id, 'file')} delay={i * 0.05}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                          <FolderOpen className="w-6 h-6 text-cyan-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-white truncate">{f.fileName}</h4>
                          <p className="text-xs text-muted-foreground">Type: {f.iconClass}</p>
                        </div>
                      </div>
                    </ItemCard>
                  ))}
                </div>
              </TabsContent>

            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      <AdminDialogs
        dialogs={dialogs}
        closeDialog={closeDialog}
        currentPartner={currentPartner}
        setCurrentPartner={setCurrentPartner}
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        currentRule={currentRule}
        setCurrentRule={setCurrentRule}
        currentTeamMember={currentTeamMember}
        setCurrentTeamMember={setCurrentTeamMember}
        currentStreamer={currentStreamer}
        setCurrentStreamer={setCurrentStreamer}
        currentAudioTrack={currentAudioTrack}
        setCurrentAudioTrack={setCurrentAudioTrack}
        handleSave={handleSave}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        itemToDelete={itemToDelete}
        handleDelete={handleDelete}
      />
    </div>
  );
}
