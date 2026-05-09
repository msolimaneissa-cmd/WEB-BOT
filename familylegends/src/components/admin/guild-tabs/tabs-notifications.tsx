import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Bell, 
  Radio, 
  Save,
  Play,
  ExternalLink,
  Info
} from 'lucide-react';

interface TabsNotificationsProps {
  streamers: any[];
  newStreamerName: string;
  setNewStreamerName: (v: string) => void;
  newStreamerUsername: string;
  setNewStreamerUsername: (v: string) => void;
  newStreamerPlatform: string;
  setNewStreamerPlatform: (v: string) => void;
  handleAddStreamer: () => void;
  handleDeleteStreamer: (username: string, platform: string) => void;
  addingStreamer: boolean;
  streamDetection: any;
  setStreamDetection: (v: any) => void;
  saveStreamDetection: () => void;
  settings: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: (tab: string) => void;
}

export const TabsNotifications: React.FC<TabsNotificationsProps> = ({ 
  streamers = [], 
  newStreamerName, 
  setNewStreamerName, 
  newStreamerUsername, 
  setNewStreamerUsername, 
  newStreamerPlatform, 
  setNewStreamerPlatform, 
  handleAddStreamer, 
  handleDeleteStreamer, 
  addingStreamer,
  streamDetection,
  setStreamDetection,
  saveStreamDetection,
  settings,
  updateField,
  saveSettings
}) => {
  const streaming = settings?.notifications?.streaming || { 
    twitchMessage: '📢 {streamer} بدأ بثاً مباشراً الآن على Twitch!\n{link}', 
    youtubeMessage: '🎥 {streamer} قام بنشر فيديو جديد أو بدأ بثاً على YouTube!\n{link}' 
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* إعدادات المنصة */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Radio className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">تنبيهات البث المباشر</CardTitle>
                  <CardDescription>إرسال تنبيهات تلقائية لمتابعيك عند توفر محتوى جديد</CardDescription>
                </div>
              </div>
              <Switch
                checked={streamDetection.enabled}
                onCheckedChange={(v) => setStreamDetection({ ...streamDetection, enabled: v })}
                className="scale-125"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> قناة التنبيهات الافتراضية
                  </Label>
                  <Input
                    value={streamDetection.channelId}
                    onChange={(e) => setStreamDetection({ ...streamDetection, channelId: e.target.value })}
                    placeholder="معرّف القناة (Channel ID)..."
                    className="font-mono bg-background/50"
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> سيتم إرسال التنبيه لهذه القناة ما لم يتم تحديد قناة خاصة للمنشئ.
                  </p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label>دقة الفحص (Interval)</Label>
                  <div className="flex items-center gap-3">
                    <Select 
                      value={streamDetection.checkInterval?.toString() || "60"} 
                      onValueChange={(v) => setStreamDetection({ ...streamDetection, checkInterval: parseInt(v) })}
                    >
                      <SelectTrigger className="w-32 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">كل 5 دقائق (Premium)</SelectItem>
                        <SelectItem value="15">كل 15 دقيقة</SelectItem>
                        <SelectItem value="30">كل 30 دقيقة</SelectItem>
                        <SelectItem value="60">كل ساعة</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">يوصى بـ 15 دقيقة للحسابات النشطة.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold">تخصيص قوالب الرسائل</Label>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className="h-3 w-3 text-[#9146FF]" />
                      <span className="text-[10px] font-medium">رسالة تنبيه Twitch</span>
                    </div>
                    <Textarea 
                      value={streaming.twitchMessage}
                      onChange={(e) => updateField('notifications', 'streaming', { ...streaming, twitchMessage: e.target.value })}
                      className="text-xs min-h-[60px] bg-background/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="h-3 w-3 text-red-500" />
                      <span className="text-[10px] font-medium">رسالة تنبيه YouTube</span>
                    </div>
                    <Textarea 
                      value={streaming.youtubeMessage}
                      onChange={(e) => updateField('notifications', 'streaming', { ...streaming, youtubeMessage: e.target.value })}
                      className="text-xs min-h-[60px] bg-background/50"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground italic">
                    المتغيرات المتاحة: {'{streamer}'}، {'{link}'}، {'{title}'}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-[10px] bg-purple-500/5 text-purple-400 border-purple-500/20 py-1">
                دعم البث: Twitch & YouTube 4K Ready
              </Badge>
              <Button onClick={() => { saveStreamDetection(); saveSettings('notifications'); }} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Save className="h-4 w-4" /> حفظ كافة الإعدادات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* إضافة ستريمر جديد */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">إضافة منشئ محتوى</CardTitle>
            <CardDescription>ربط قناة جديدة بنظام التنبيهات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">الاسم التعريفي</Label>
                <Input
                  value={newStreamerName}
                  onChange={(e) => setNewStreamerName(e.target.value)}
                  placeholder="مثال: Family Legends"
                  className="bg-background/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">اسم المستخدم / المعرف (Username)</Label>
                <div className="relative">
                  <Input
                    value={newStreamerUsername}
                    onChange={(e) => setNewStreamerUsername(e.target.value)}
                    placeholder="shroud, @MrBeast..."
                    className="bg-background/40 pr-8"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">المنصة</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={newStreamerPlatform === 'twitch' ? 'default' : 'outline'} 
                    onClick={() => setNewStreamerPlatform('twitch')}
                    className={`h-9 text-xs gap-2 ${newStreamerPlatform === 'twitch' ? 'bg-[#9146FF] hover:bg-[#7d3cdb]' : ''}`}
                  >
                    <Radio className="h-4 w-4" /> Twitch
                  </Button>
                  <Button 
                    variant={newStreamerPlatform === 'youtube' ? 'default' : 'outline'} 
                    onClick={() => setNewStreamerPlatform('youtube')}
                    className={`h-9 text-xs gap-2 ${newStreamerPlatform === 'youtube' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    <Play className="h-4 w-4" /> YouTube
                  </Button>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleAddStreamer}
              disabled={addingStreamer || !newStreamerName || !newStreamerUsername}
              className="w-full mt-2 shadow-lg shadow-primary/10"
            >
              {addingStreamer ? "جاري الإضافة..." : "إضافة إلى القائمة"}
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* قائمة المتابعة */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                القنوات المتابعة حالياً <Badge variant="secondary" className="rounded-full px-2">{streamers.length}</Badge>
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {streamers.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${s.platform === 'twitch' ? 'bg-[#9146FF]/10 text-[#9146FF]' : 'bg-red-500/10 text-red-500'}`}>
                    {s.platform === 'twitch' ? <Radio className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{s.name}</span>
                      <a href={s.platform === 'twitch' ? `https://twitch.tv/${s.username}` : `https://youtube.com/${s.username}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
                      </a>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">@{s.username}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end mr-6">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">آخر حالة</span>
                    <Badge variant="outline" className="text-[9px] bg-green-500/5 text-green-400 border-green-500/20">متصل (Online)</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteStreamer(s.username, s.platform)}
                    className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {streamers.length === 0 && (
              <div className="py-20 text-center text-muted-foreground space-y-3">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
                  <Bell className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">لا توجد قنوات متابعة حالياً</p>
                <p className="text-xs opacity-60">أضف بعض القنوات من الأعلى لتبدأ في تلقي التنبيهات.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
