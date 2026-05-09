import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Shield, 
  Save, 
  Zap, 
  Link2, 
  MailWarning, 
  CaseSensitive, 
  AlertOctagon,
  AtSign,
  Bomb,
  MessageSquare,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

interface TabsProtectionProps {
  settings: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: () => void;
  saving: boolean;
  getProtection: () => any;
}

export const TabsProtection: React.FC<TabsProtectionProps> = ({ 
  settings, 
  updateField, 
  saveSettings, 
  saving,
  getProtection
}) => {
  const protection = getProtection();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Anti-Spam */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <CardTitle>مكافحة السبام (Anti-Spam)</CardTitle>
            </div>
            <Switch
              checked={protection.antiSpam.enabled}
              onCheckedChange={(v) => updateField('protection', 'antiSpam', { ...protection.antiSpam, enabled: v })}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأقصى للرسائل</Label>
                <Input
                  type="number"
                  value={protection.antiSpam.maxMessages}
                  onChange={(e) => updateField('protection', 'antiSpam', { ...protection.antiSpam, maxMessages: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="space-y-2">
                <Label>الفترة الزمنية (ms)</Label>
                <Input
                  type="number"
                  value={protection.antiSpam.interval}
                  onChange={(e) => updateField('protection', 'antiSpam', { ...protection.antiSpam, interval: parseInt(e.target.value) || 5000 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>نوع العقوبة</Label>
              <Select
                value={protection.antiSpam.punishment}
                onValueChange={(v) => updateField('protection', 'antiSpam', { ...protection.antiSpam, punishment: v })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeout">إسكات (Timeout)</SelectItem>
                  <SelectItem value="kick">طرد (Kick)</SelectItem>
                  <SelectItem value="ban">حظر (Ban)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Anti-Link */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-400" />
              <CardTitle>مكافحة الروابط (Anti-Link)</CardTitle>
            </div>
            <Switch
              checked={protection.antiLink.enabled}
              onCheckedChange={(v) => updateField('protection', 'antiLink', { ...protection.antiLink, enabled: v })}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">يمنع الأعضاء من إرسال الروابط في القنوات غير المسموح بها.</p>
            <div className="space-y-2">
              <Label>القنوات المسموح بها (ID)</Label>
              <Input
                placeholder="معرفات القنوات مفصولة بفاصلة..."
                value={protection.antiLink.allowedChannels?.join(', ') || ''}
                onChange={(e) => updateField('protection', 'antiLink', { ...protection.antiLink, allowedChannels: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Anti-Mention */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <AtSign className="h-5 w-5 text-purple-400" />
              <CardTitle>مكافحة المنشن (Anti-Mention)</CardTitle>
            </div>
            <Switch
              checked={protection.antiMention?.enabled}
              onCheckedChange={(v) => updateField('protection', 'antiMention', { ...protection.antiMention, enabled: v })}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأقصى للإشارات</Label>
                <Input
                  type="number"
                  value={protection.antiMention?.maxMentions}
                  onChange={(e) => updateField('protection', 'antiMention', { ...protection.antiMention, maxMentions: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="space-y-2">
                <Label>العقوبة</Label>
                <Select
                  value={protection.antiMention?.action}
                  onValueChange={(v) => updateField('protection', 'antiMention', { ...protection.antiMention, action: v })}
                >
                  <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timeout">إسكات</SelectItem>
                    <SelectItem value="kick">طرد</SelectItem>
                    <SelectItem value="ban">حظر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anti-Swear */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-red-400" />
              <CardTitle>مكافحة الشتائم (Anti-Swear)</CardTitle>
            </div>
            <Switch
              checked={protection.antiSwear?.enabled}
              onCheckedChange={(v) => updateField('protection', 'antiSwear', { ...protection.antiSwear, enabled: v })}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>الكلمات الممنوعة</Label>
              <Textarea
                placeholder="كلمة1, كلمة2, كلمة3..."
                value={protection.antiSwear?.customWords?.join(', ') || ''}
                onChange={(e) => updateField('protection', 'antiSwear', { ...protection.antiSwear, customWords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Anti-Nuke */}
        <Card className="glass-card md:col-span-2 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Bomb className="h-6 w-6 text-red-500" />
              <div>
                <CardTitle className="text-xl">نظام الحماية القصوى (Anti-Nuke)</CardTitle>
                <CardDescription>حماية السيرفر من التخريب الجماعي وحذف الرتب والقنوات.</CardDescription>
              </div>
            </div>
            <Switch
              checked={protection.antiNuke?.enabled}
              onCheckedChange={(v) => updateField('protection', 'antiNuke', { ...protection.antiNuke, enabled: v })}
            />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2">
              <Label>حذف القنوات (Max)</Label>
              <Input
                type="number"
                value={protection.antiNuke?.maxChannelDelete}
                onChange={(e) => updateField('protection', 'antiNuke', { ...protection.antiNuke, maxChannelDelete: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div className="space-y-2">
              <Label>حذف الرتب (Max)</Label>
              <Input
                type="number"
                value={protection.antiNuke?.maxRoleDelete}
                onChange={(e) => updateField('protection', 'antiNuke', { ...protection.antiNuke, maxRoleDelete: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div className="space-y-2">
              <Label>البيند الجماعي (Max)</Label>
              <Input
                type="number"
                value={protection.antiNuke?.maxBan}
                onChange={(e) => updateField('protection', 'antiNuke', { ...protection.antiNuke, maxBan: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>الإجراء عند الكشف</Label>
              <Select
                value={protection.antiNuke?.action}
                onValueChange={(v) => updateField('protection', 'antiNuke', { ...protection.antiNuke, action: v })}
              >
                <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarantine">حجر الخبير (Quarantine)</SelectItem>
                  <SelectItem value="strip">سحب جميع الرتب (Strip Roles)</SelectItem>
                  <SelectItem value="ban">حظر المخرب (Ban)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card className="glass-card md:col-span-2 border-blue-500/20 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle className="text-xl">تفعيل التحقق (Verification System)</CardTitle>
                <CardDescription>يتطلب من الأعضاء الجدد الضغط على زر للتحقق قبل دخول السيرفر.</CardDescription>
              </div>
            </div>
            <Switch
              checked={protection.verification?.enabled}
              onCheckedChange={(v) => updateField('protection', 'verification', { ...protection.verification, enabled: v })}
            />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رتبة التحقق (ID)</Label>
                <Input
                  value={protection.verification?.roleId}
                  onChange={(e) => updateField('protection', 'verification', { ...protection.verification, roleId: e.target.value })}
                  placeholder="ID الرتبة التي سيحصل عليها العضو..."
                />
              </div>
              <div className="space-y-2">
                <Label>قناة التحقق (ID)</Label>
                <Input
                  value={protection.verification?.channelId}
                  onChange={(e) => updateField('protection', 'verification', { ...protection.verification, channelId: e.target.value })}
                  placeholder="ID القناة التي سيظهر فيها الزر..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>رسالة التحقق</Label>
              <Textarea
                value={protection.verification?.message}
                onChange={(e) => updateField('protection', 'verification', { ...protection.verification, message: e.target.value })}
                className="h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Anti-Invite */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <MailWarning className="h-5 w-5 text-orange-400" />
              <CardTitle>مكافحة الدعوات (Anti-Invite)</CardTitle>
            </div>
            <Switch
              checked={protection.antiInvite.enabled}
              onCheckedChange={(v) => updateField('protection', 'antiInvite', { ...protection.antiInvite, enabled: v })}
            />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">يمنع نشر روابط دعوات سيرفرات الديسكورد الأخرى.</p>
          </CardContent>
        </Card>

        {/* Anti-Caps */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CaseSensitive className="h-5 w-5 text-green-400" />
              <CardTitle>مكافحة الأحرف الكبيرة (Caps)</CardTitle>
            </div>
            <Switch
              checked={protection.antiCaps.enabled}
              onCheckedChange={(v) => updateField('protection', 'antiCaps', { ...protection.antiCaps, enabled: v })}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النسبة المئوية (%)</Label>
                <Input
                  type="number"
                  value={protection.antiCaps.minCapsPercentage}
                  onChange={(e) => updateField('protection', 'antiCaps', { ...protection.antiCaps, minCapsPercentage: parseInt(e.target.value) || 70 })}
                />
              </div>
              <div className="space-y-2">
                <Label>أدنى طول للرسالة</Label>
                <Input
                  type="number"
                  value={protection.antiCaps.minCapsLength}
                  onChange={(e) => updateField('protection', 'antiCaps', { ...protection.antiCaps, minCapsLength: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={saveSettings} disabled={saving} className="gap-2 h-12 px-8 text-lg font-bold shadow-lg shadow-primary/20">
          <Save className="h-5 w-5" /> حفظ إعدادات الحماية
        </Button>
      </div>
    </div>
  );
};
