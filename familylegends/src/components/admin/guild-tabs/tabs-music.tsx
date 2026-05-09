import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Music, 
  Save, 
  Volume2, 
  ListMusic, 
  Power, 
  Clock,
  Shield
} from 'lucide-react';

interface TabsMusicProps {
  settings: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: (tab: string) => void;
  saving: boolean;
}

export const TabsMusic: React.FC<TabsMusicProps> = ({ 
  settings, 
  updateField, 
  saveSettings, 
  saving 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Music className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle>مشغل الموسيقى (Music Player)</CardTitle>
                <CardDescription>إدارة جودة الصوت، قائمة الانتظار، والصلاحيات</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm">وضع 24/7</Label>
              <Switch
                checked={settings.music.stay247}
                onCheckedChange={(v) => updateField('music', 'stay247', v)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" /> مستوى الصوت الافتراضي (0-100)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.music.defaultVolume}
                  onChange={(e) => updateField('music', 'defaultVolume', parseInt(e.target.value) || 80)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ListMusic className="h-4 w-4" /> الحد الأقصى لقائمة الانتظار
                </Label>
                <Input
                  type="number"
                  value={settings.music.maxQueueSize}
                  onChange={(e) => updateField('music', 'maxQueueSize', parseInt(e.target.value) || 100)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white/5">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Power className="h-4 w-4 text-red-400" /> المغادرة عند خلو القناة
                  </Label>
                  <p className="text-[10px] text-muted-foreground">يخرج البوت من القناة الصوتية إذا لم يوجد مستمعين</p>
                </div>
                <Switch
                  checked={settings.music.leaveOnEmpty}
                  onCheckedChange={(v) => updateField('music', 'leaveOnEmpty', v)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> وقت الانتظار قبل الخروج (بالثواني)
                </Label>
                <Input
                  type="number"
                  value={settings.music.emptyCooldown}
                  onChange={(e) => updateField('music', 'emptyCooldown', parseInt(e.target.value) || 60)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-white/5" />

          <div className="p-4 border border-dashed rounded-xl bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold flex items-center gap-2 text-blue-400">
                  <Shield className="h-4 w-4" /> وضع الـ DJ فقط
                </h4>
                <p className="text-xs text-muted-foreground">عند التفعيل، يمكن فقط للأعضاء الذين يملكون رتبة DJ التحكم في الموسيقى.</p>
              </div>
              <Switch
                checked={settings.music.djOnly}
                onCheckedChange={(v) => updateField('music', 'djOnly', v)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveSettings('music')} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> حفظ إعدادات الموسيقى
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
