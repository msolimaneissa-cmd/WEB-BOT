import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Save, Loader2, UserCheck, Hash, MessageSquare } from 'lucide-react';

interface TabsVerifyProps {
  settings: any;
  updateField: (section: string, field: string, value: any) => void;
  saveSettings: (section: string) => Promise<void>;
  saving: boolean;
}

export const TabsVerify: React.FC<TabsVerifyProps> = ({ settings, updateField, saveSettings, saving }) => {
  const verify = settings?.protection?.verification || {
    enabled: false,
    roleId: '',
    channelId: '',
    message: 'اضغط على الزر بالأسفل للتحقق والدخول للسيرفر.'
  };

  const handleToggle = (val: boolean) => {
    const currentProtection = settings?.protection || {};
    updateField('protection', 'verification', { ...verify, enabled: val });
  };

  const handleInputChange = (field: string, val: any) => {
    const currentProtection = settings?.protection || {};
    updateField('protection', 'verification', { ...verify, [field]: val });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" /> نظام التحقق (Verification)
          </h3>
          <p className="text-sm text-muted-foreground">احمِ سيرفرك بفرض التحقق على الأعضاء الجدد</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-lg border border-white/10">
          <Label htmlFor="verify-enabled" className="cursor-pointer">تفعيل التحقق</Label>
          <Switch 
            id="verify-enabled" 
            checked={verify.enabled} 
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-400" /> رتبة التحقق
            </CardTitle>
            <CardDescription>الرتبة التي سيحصل عليها العضو بعد التحقق</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>معرف الرتبة (Verified Role ID)</Label>
              <Input 
                placeholder="1234567890..." 
                value={verify.roleId} 
                onChange={(e) => handleInputChange('roleId', e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-400" /> قناة التحقق
            </CardTitle>
            <CardDescription>القناة التي سيظهر فيها زر التحقق</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>معرف القناة (Channel ID)</Label>
              <Input 
                placeholder="1234567890..." 
                value={verify.channelId} 
                onChange={(e) => handleInputChange('channelId', e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-yellow-500" /> رسالة التحقق
            </CardTitle>
            <CardDescription>الرسالة التي ستظهر فوق زر التحقق في الـ Embed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea 
                placeholder="اكتب رسالة التحقق هنا..." 
                value={verify.message} 
                onChange={(e) => handleInputChange('message', e.target.value)}
                className="min-h-[100px] bg-white/5 border-white/10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => saveSettings('protection')} 
          disabled={saving}
          className="bg-primary hover:bg-primary/80 text-black px-8 py-6 rounded-xl font-bold shadow-lg gap-2"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
};
