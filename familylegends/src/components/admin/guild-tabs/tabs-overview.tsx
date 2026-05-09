import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MessageCircle, 
  Trophy, 
  Ticket as TicketIcon, 
  Shield, 
  Activity as ActivityIcon,
  BarChart3,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface TabsOverviewProps {
  stats: any;
  botHealth: any;
  members: any[];
  fetchData: () => void;
  guildId?: string;
}

export const TabsOverview: React.FC<TabsOverviewProps> = ({ stats, botHealth, members, fetchData, guildId: propGuildId }) => {
  const params = useParams() as { guildId?: string };
  const guildId = propGuildId || params?.guildId;

  const activityData = stats?.activityHistory || [];
  const hasActivity = activityData.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Bot Health & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card overflow-hidden group">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">حالة البوت</CardTitle>
            <ActivityIcon className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">متصل (Online)</div>
            <p className="text-xs text-muted-foreground mt-1">Ping: {botHealth?.ping || 0}ms</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card group">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الأعضاء</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">عضو نشط في السيرفر</p>
          </CardContent>
        </Card>

        <Card className="glass-card group">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">الرسائل (اليوم)</CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">تفاعل مستمر خلال 24 ساعة</p>
          </CardContent>
        </Card>

        <Card className="glass-card group">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">التذاكر المفتوحة</CardTitle>
            <TicketIcon className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">تذكرة بانتظار الرد</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* النشاط الأخير */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> نشاط السيرفر
                </CardTitle>
                <CardDescription>نظرة عامة على تفاعل الأعضاء في آخر 7 أيام</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className="h-3 w-3" /> تحديث
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] border-t border-white/5 pt-6 flex items-center justify-center">
            {hasActivity ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#888', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis hide={true} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,215,0,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1a1a1a] border border-primary/20 p-2 rounded shadow-xl">
                            <p className="text-xs font-bold text-primary">{payload[0].payload.name}</p>
                            <p className="text-sm font-bold text-white">{payload[0].value} رسالة</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="messages" radius={[4, 4, 0, 0]} barSize={30}>
                    {activityData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === activityData.length - 1 ? '#FFD700' : 'rgba(255,215,0,0.3)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-50">
                <BarChart3 className="h-10 w-10" />
                <p className="text-sm">لا يوجد بيانات نشاط مسجلة حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* المتصدرون سريعا */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> الأوائل
              </CardTitle>
              <Button asChild variant="link" size="sm" className="text-xs">
                <Link href={guildId ? `/admin/bot/guilds/${guildId}/leaderboard` : '/admin/bot/settings/leaderboard'}>الكل</Link>
              </Button>
            </div>
            <CardDescription>أكثر الأعضاء تفاعلاً</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t border-white/5">
             <div className="divide-y divide-white/5">
                {members.slice(0, 5).map((m, i) => (
                  <div key={m.userId} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                        {i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m.userId}</span>
                        <span className="text-[10px] text-muted-foreground">Lvl {m.level} • {m.xp} XP</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                      {m.totalMessages} رسالة
                    </Badge>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
