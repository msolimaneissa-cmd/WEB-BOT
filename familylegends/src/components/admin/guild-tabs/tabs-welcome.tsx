import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Save, 
  UserMinus, 
  Zap,
  Layout,
  Users,
  MessageCircle,
  Loader2
} from 'lucide-react';

interface TabsWelcomeProps {
  settings: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: (tab: string) => Promise<void>;
  saving: boolean;
}

export const TabsWelcome: React.FC<TabsWelcomeProps> = ({ settings, updateField, saveSettings, saving }) => {
  const welcome = settings?.welcome || { enabled: false, channelId: '', message: '', autoRoleId: '' };
  const goodbye = settings?.goodbye || { enabled: false, channelId: '', message: '' };
  const booster = settings?.booster || { enabled: false, channelId: '', message: 'شكراً لك {user} على دعم السيرفر! أصبح عدد الـ Boosts الآن: {boost_count}' };
  const welcomeImage = settings?.welcomeImage || { enabled: false, background: 'default', font: 'Cairo', color: '#FFFFFF' };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* نظام الترحيب */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>نظام الترحيب (Welcome)</CardTitle>
                  <CardDescription>إرسال رسالة عند انضمام عضو جديد</CardDescription>
                </div>
              </div>
              <Switch
                checked={welcome.enabled}
                onCheckedChange={(v) => updateField('welcome', 'enabled', v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>قناة الترحيب</Label>
                <Input
                  value={welcome.channelId}
                  onChange={(e) => updateField('welcome', 'channelId', e.target.value)}
                  placeholder="ID القناة..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>رتبة الدخول</Label>
                <Input
                  value={welcome.autoRoleId}
                  onChange={(e) => updateField('welcome', 'autoRoleId', e.target.value)}
                  placeholder="ID الرتبة..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>رسالة الترحيب</Label>
              <Textarea
                value={welcome.message}
                onChange={(e) => updateField('welcome', 'message', e.target.value)}
                placeholder="أهلاً بك {user} في السيرفر..."
                className="min-h-[80px]"
              />
              <p className="text-[10px] text-muted-foreground">متغيرات: {'{user}, {server}, {count}'}</p>
            </div>
            <Button onClick={() => saveSettings('welcome')} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ إعدادات الترحيب
            </Button>
          </CardContent>
        </Card>

        {/* نظام الوداع */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <UserMinus className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle>نظام الوداع (Goodbye)</CardTitle>
                  <CardDescription>إرسال رسالة عند مغادرة عضو</CardDescription>
                </div>
              </div>
              <Switch
                checked={goodbye.enabled}
                onCheckedChange={(v) => updateField('goodbye', 'enabled', v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>قناة الوداع</Label>
              <Input
                value={goodbye.channelId}
                onChange={(e) => updateField('goodbye', 'channelId', e.target.value)}
                placeholder="ID القناة..."
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>رسالة الوداع</Label>
              <Textarea
                value={goodbye.message}
                onChange={(e) => updateField('goodbye', 'message', e.target.value)}
                placeholder="وداعاً {user}..."
                className="min-h-[80px]"
              />
              <p className="text-[10px] text-muted-foreground">متغيرات: {'{user}, {count}'}</p>
            </div>
            <Button onClick={() => saveSettings('goodbye')} disabled={saving} variant="outline" className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ إعدادات الوداع
            </Button>
          </CardContent>
        </Card>

        {/* نظام دعم السيرفر */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle>رسائل الداعمين (Server Boost)</CardTitle>
                  <CardDescription>الاحتفال بمن يقومون بترقية السيرفر</CardDescription>
                </div>
              </div>
              <Switch
                checked={booster.enabled}
                onCheckedChange={(v) => updateField('booster', 'enabled', v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>قناة الإعلان</Label>
                  <Input
                    value={booster.channelId}
                    onChange={(e) => updateField('booster', 'channelId', e.target.value)}
                    placeholder="ID القناة..."
                    className="font-mono text-xs"
                  />
                </div>
                <Button onClick={() => saveSettings('booster')} disabled={saving} className="w-full gap-2 bg-pink-600 hover:bg-pink-700 text-white">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ إعدادات الداعمين
                </Button>
              </div>
              <div className="space-y-2">
                <Label>رسالة الشكر</Label>
                <Textarea
                  value={booster.message}
                  onChange={(e) => updateField('booster', 'message', e.target.value)}
                  placeholder="شكراً لك {user} على الابتسامة..."
                  className="min-h-[100px]"
                />
                <p className="text-[10px] text-muted-foreground">متغيرات: {'{user}, {boost_count}'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* صورة الترحيب */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Layout className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>صورة الترحيب الاحترافية</CardTitle>
                  <CardDescription>تخصيص خلفية وألوان صورة الترحيب</CardDescription>
                </div>
              </div>
              <Switch
                checked={welcomeImage.enabled}
                onCheckedChange={(v) => updateField('welcomeImage', 'enabled', v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>خلفية الصورة</Label>
                  <Input
                    value={welcomeImage.background}
                    onChange={(e) => updateField('welcomeImage', 'background', e.target.value)}
                    placeholder="رابط الصورة أو 'default'..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>لون النص الأساسي</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={welcomeImage.color}
                      onChange={(e) => updateField('welcomeImage', 'color', e.target.value)}
                      className="w-12 p-1"
                    />
                    <Input
                      value={welcomeImage.color}
                      onChange={(e) => updateField('welcomeImage', 'color', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <Button onClick={() => saveSettings('welcomeImage')} disabled={saving} variant="secondary" className="w-full gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ إعدادات الصورة
                </Button>
              </div>

              {/* Preview Area */}
              <div className="space-y-2">
                <Label>معاينة التصميم</Label>
                <div 
                  className="aspect-[2/1] rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden bg-black/40"
                  style={{ 
                    backgroundImage: welcomeImage.background && welcomeImage.background !== 'default' ? `url(${welcomeImage.background})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="flex flex-col items-center gap-2 relative z-10 p-4 bg-black/20 backdrop-blur-[2px] rounded-lg">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/50 bg-white/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white/50" />
                    </div>
                    <div className="text-center" style={{ color: welcomeImage.color }}>
                      <p className="text-[10px] font-bold opacity-80">WELCOME</p>
                      <p className="text-lg font-bold">User#0001</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
