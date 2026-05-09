import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Ticket as TicketIcon, Save, Loader2, Users, Folder, MessageSquare, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TabsTicketsProps {
  settings: any;
  updateField: (section: string, field: string, value: any) => void;
  saveSettings: (section: string) => Promise<void>;
  saving: boolean;
}

export const TabsTickets: React.FC<TabsTicketsProps> = ({ settings, updateField, saveSettings, saving }) => {
  const tickets = settings?.tickets || {
    enabled: false,
    categoryId: '',
    staffRoleId: '',
    logChannelId: '',
    limitPerUser: 1,
    welcomeMessage: 'مرحباً بك في تذكرتك، سيقوم فريق الدعم بالرد عليك قريباً.'
  };

  const handleToggle = (val: boolean) => updateField('tickets', 'enabled', val);
  const handleInputChange = (field: string, val: any) => updateField('tickets', field, val);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TicketIcon className="h-5 w-5 text-primary" /> نظام التذاكر
          </h3>
          <p className="text-sm text-muted-foreground">قم بإعداد نظام الدعم الفني الخاص بسيرفرك</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-lg border border-white/10">
          <Label htmlFor="ticket-enabled" className="cursor-pointer">تفعيل النظام</Label>
          <Switch 
            id="ticket-enabled" 
            checked={tickets.enabled} 
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      <Alert className="bg-primary/10 border-primary/20 text-primary">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>ملاحظة</AlertTitle>
        <AlertDescription>
          تأكد من إعطاء البوت صلاحيات "إدارة القنوات" و "إدارة الرتب" ليعمل نظام التذاكر بشكل صحيح.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Folder className="h-4 w-4 text-blue-400" /> إعدادات القنوات
            </CardTitle>
            <CardDescription>تحديد أين تفتح التذاكر وأين تسجل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>معرف الفئة (Category ID)</Label>
              <Input 
                placeholder="1234567890..." 
                value={tickets.categoryId} 
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="bg-white/5 border-white/10"
              />
              <p className="text-[10px] text-muted-foreground">اتركه فارغاً ليتم إنشاء القنوات تلقائياً خارج أي فئة</p>
            </div>
            <div className="space-y-2">
              <Label>قناة السجلات (Log Channel)</Label>
              <Input 
                placeholder="1234567890..." 
                value={tickets.logChannelId} 
                onChange={(e) => handleInputChange('logChannelId', e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Staff & Access */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" /> الدعم والوصول
            </CardTitle>
            <CardDescription>التحكم في من يمكنه رؤية التذاكر</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>رتبة الدعم الفني (Staff Role ID)</Label>
              <Input 
                placeholder="1234567890..." 
                value={tickets.staffRoleId} 
                onChange={(e) => handleInputChange('staffRoleId', e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للتذاكر لكل عضو</Label>
              <Input 
                type="number"
                min="1"
                max="10"
                value={tickets.limitPerUser} 
                onChange={(e) => handleInputChange('limitPerUser', parseInt(e.target.value))}
                className="bg-white/5 border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Messaging */}
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-yellow-500" /> الرسالة الترحيبية
            </CardTitle>
            <CardDescription>تظهر هذه الرسالة عند فتح التذكرة الجديدة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea 
                placeholder="اكتب رسالة الترحيب هنا..." 
                value={tickets.welcomeMessage} 
                onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                className="min-h-[100px] bg-white/5 border-white/10"
              />
              <p className="text-[10px] text-muted-foreground">يمكنك استخدام {`{user}`} للإشارة لصاحب التذكرة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => saveSettings('tickets')} 
          disabled={saving}
          className="bg-primary hover:bg-primary/80 text-black px-8 py-6 rounded-xl font-bold shadow-lg gap-2"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
};
