import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Medal, 
  Save, 
  Clock, 
  Target,
  Plus,
  Trash2,
  Award,
  ChevronRight
} from 'lucide-react';

interface TabsLevelsProps {
  settings: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: (tab: string) => void;
  saving: boolean;
}

export const TabsLevels: React.FC<TabsLevelsProps> = ({ 
  settings, 
  updateField, 
  saveSettings, 
  saving 
}) => {
  const [newLevel, setNewLevel] = useState('');
  const [newRole, setNewRole] = useState('');

  const addReward = () => {
    if (!newLevel || !newRole) return;
    const currentRoles = settings.leveling?.roles || {};
    updateField('leveling', 'roles', {
      ...currentRoles,
      [newLevel]: newRole
    });
    setNewLevel('');
    setNewRole('');
  };

  const removeReward = (lvl: string) => {
    const currentRoles = { ...settings.leveling?.roles };
    delete currentRoles[lvl];
    updateField('leveling', 'roles', currentRoles);
  };

  const levelRoles = settings.leveling?.roles || {};
  const sortedLevels = Object.keys(levelRoles).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Medal className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>نظام المستويات والـ XP</CardTitle>
                    <CardDescription>إدارة نظام التفاعل والمكافآت في السيرفر</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-sm">تفعيل النظام</Label>
                  <Switch
                    checked={settings.leveling?.enabled ?? true}
                    onCheckedChange={(v) => updateField('leveling', 'enabled', v)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Target className="h-3 w-3" /> قناة التنبيه بالترقية
                  </Label>
                  <Input
                    value={settings.leveling?.channelId || ''}
                    onChange={(e) => updateField('leveling', 'channelId', e.target.value)}
                    placeholder="اتركه فارغاً للإرسال في نفس القناة..."
                    className="font-mono bg-white/[0.02]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3 w-3" /> فترة الانتظار (Cooldown)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={settings.leveling?.cooldown || 60000}
                      onChange={(e) => updateField('leveling', 'cooldown', parseInt(e.target.value) || 60000)}
                      className="bg-white/[0.02] pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">ms</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">الـ XP لكل رسالة (الأدنى)</Label>
                  <Input
                    type="number"
                    value={settings.leveling?.xpRange?.min || 15}
                    onChange={(e) => updateField('leveling', 'xpRange', { ...settings.leveling.xpRange, min: parseInt(e.target.value) || 15 })}
                    className="bg-white/[0.02]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">الـ XP لكل رسالة (الأقصى)</Label>
                  <Input
                    type="number"
                    value={settings.leveling?.xpRange?.max || 25}
                    onChange={(e) => updateField('leveling', 'xpRange', { ...settings.leveling.xpRange, max: parseInt(e.target.value) || 25 })}
                    className="bg-white/[0.02]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">رسالة الترقية</Label>
                <Textarea
                  value={settings.leveling?.message || ''}
                  onChange={(e) => updateField('leveling', 'message', e.target.value)}
                  className="min-h-[100px] bg-white/[0.02] leading-relaxed"
                  placeholder="مبروك {user}، لقد وصلت للمستوى {level}!"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['{user}', '{level}', '{xp}'].map(tag => (
                    <span key={tag} className="px-2 py-1 rounded bg-primary/5 border border-primary/10 text-[10px] font-mono text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-primary/[0.02] border-b border-white/5">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gold" />
                <CardTitle className="text-lg">مكافآت الرتب</CardTitle>
              </div>
              <CardDescription>تعيين رتب معينة عند الوصول لمستوى محدد</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 space-y-4 border-b border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">المستوى</Label>
                    <Input 
                      placeholder="مثال: 5" 
                      type="number" 
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="h-9 bg-white/[0.02]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">ID الرتبة</Label>
                    <Input 
                      placeholder="Role ID" 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="h-9 font-mono bg-white/[0.02]"
                    />
                  </div>
                </div>
                <Button 
                  onClick={addReward} 
                  disabled={!newLevel || !newRole}
                  className="w-full h-9 gap-2 bg-gold hover:bg-gold/90 text-black font-bold text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> إضافة مكافأة
                </Button>
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {sortedLevels.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {sortedLevels.map((lvl) => (
                      <div key={lvl} className="flex items-center justify-between p-4 group hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold font-black text-xs">
                            {lvl}
                          </div>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <div className="font-mono text-[11px] text-muted-foreground bg-white/[0.03] px-2 py-1 rounded">
                            {levelRoles[lvl]}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeReward(lvl)}
                          className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <Award className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-xs text-muted-foreground">لم يتم تعيين أي مكافآت بعد.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={() => saveSettings('leveling')} 
            disabled={saving} 
            className="w-full gap-3 h-14 bg-primary text-primary-foreground font-black text-sm shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all"
          >
            {saving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التغييرات
          </Button>
        </div>
      </div>
    </div>
  );
};
