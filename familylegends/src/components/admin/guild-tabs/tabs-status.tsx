import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Globe, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Clock,
  RefreshCw
} from 'lucide-react';

interface TabsStatusProps {
  botHealth: any;
  stats: any;
  fetchData: () => void;
}

export const TabsStatus: React.FC<TabsStatusProps> = ({ botHealth, stats, fetchData }) => {
  const isOnline = botHealth?.online ?? true;
  
  const uptimeHours = botHealth?.uptime ? Math.floor(botHealth.uptime / 3600) : 0;
  const uptimeDays = Math.floor(uptimeHours / 24);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> حالة النظام والخدمة
          </h3>
          <p className="text-sm text-muted-foreground">مراقبة أداء البوت واستقرار الاتصال بقاعدة البيانات</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2 border-white/10 glass-card">
          <RefreshCw className="h-4 w-4" /> تحديث البيانات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Status */}
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" /> الحالة المباشرة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="flex flex-wrap gap-8">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">حالة البوت</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-lg font-bold">{isOnline ? 'متصل' : 'غير متصل'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">قاعدة البيانات</p>
                <div className="flex items-center gap-2 text-lg font-bold">
                  <div className={`w-3 h-3 rounded-full ${botHealth?.database === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  {botHealth?.database === 'connected' ? 'Atlas Connected' : 'Connecting...'}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">وقت التشغيل</p>
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="h-4 w-4 text-primary" />
                  {uptimeDays} يوم، {uptimeHours % 24} ساعة
                </div>
              </div>
            </div>

            <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">سرعة الاستجابة (Latency)</span>
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                  {botHealth?.ping || 0} ms
                </Badge>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.max(10, 100 - (botHealth?.ping || 0) / 5))}%` }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" /> موارد النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" /> الذاكرة المستخدمة
                </div>
                <span className="font-mono text-primary">{botHealth?.memory || botHealth?.ram || '---'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" /> استهلاك المعالج
                </div>
                <span className="font-mono text-primary">{botHealth?.cpu || '---'}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-500" /> الحماية الذكية
                </div>
                <Badge className="bg-green-500/10 text-green-500 border-none">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="glass-card p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
              <Users className="h-3 w-3" /> إجمالي السيرفرات
            </div>
            <div className="text-2xl font-bold">{botHealth?.guildCount || 0}</div>
         </div>
         <div className="glass-card p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
              <Users className="h-3 w-3" /> إجمالي المستخدمين
            </div>
            <div className="text-2xl font-bold">{botHealth?.userCount || 0}</div>
         </div>
         <div className="glass-card p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
              <MessageSquare className="h-3 w-3" /> إجمالي الرسائل
            </div>
            <div className="text-2xl font-bold">{botHealth?.totalMessages || 0}</div>
         </div>
         <div className="glass-card p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
              <Activity className="h-3 w-3" /> الأوامر المتاحة
            </div>
            <div className="text-2xl font-bold">{botHealth?.commandCount || 0} فئة</div>
         </div>
      </div>
    </div>
  );
};
