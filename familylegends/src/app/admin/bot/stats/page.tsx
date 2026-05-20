'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bot, Server, Users, Activity, TrendingUp, TrendingDown, 
  Clock, CheckCircle, AlertCircle, Download, RefreshCw,
  MessageSquare, Music, Ticket, Shield, Coins, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

// بيانات تجريبية - سيتم استبدالها ببيانات حقيقية من API
const mockStats = {
  bot: {
    ping: 45,
    uptime: '15d 7h 32m',
    guilds: 127,
    users: 45823,
    memory: '256MB',
    cpu: '12%',
    version: '2.0.0'
  },
  commands: {
    total: 156789,
    today: 2341,
    topCommands: [
      { name: '/موسيقى', count: 4521 },
      { name: '/تذكرة', count: 3892 },
      { name: '/مستوى', count: 3456 },
      { name: '/اقتصاد', count: 2987 },
      { name: '/اعتدال', count: 2134 }
    ]
  },
  tickets: {
    open: 23,
    closed: 1456,
    today: 12,
    avgResponseTime: '5m 32s'
  },
  economy: {
    totalCoins: 987654321,
    activeTraders: 3421,
    topUsers: [
      { name: 'Ahmed#1234', coins: 125000 },
      { name: 'Sarah#5678', coins: 98000 },
      { name: 'Mohamed#9012', coins: 87500 }
    ]
  }
};

const activityData = [
  { name: 'السبت', commands: 2400, messages: 1800, voice: 1200 },
  { name: 'الأحد', commands: 1398, messages: 2210, voice: 1100 },
  { name: 'الاثنين', commands: 9800, messages: 3290, voice: 2300 },
  { name: 'الثلاثاء', commands: 3908, messages: 4300, voice: 2100 },
  { name: 'الأربعاء', commands: 4800, messages: 3100, voice: 1900 },
  { name: 'الخميس', commands: 3800, messages: 4200, voice: 2400 },
  { name: 'الجمعة', commands: 4300, messages: 5100, voice: 2800 }
];

const serviceData = [
  { name: 'التذاكر', value: 35, color: '#5865F2' },
  { name: 'الموسيقى', value: 25, color: '#EB459E' },
  { name: 'الاقتصاد', value: 20, color: '#57F287' },
  { name: 'المستويات', value: 15, color: '#FFD700' },
  { name: 'الإشراف', value: 5, color: '#ED4245' }
];

const COLORS = ['#5865F2', '#EB459E', '#57F287', '#FFD700', '#ED4245'];

export default function BotStatsPage() {
  const [stats, setStats] = useState<typeof mockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = async () => {
    setLoading(true);
    // محاكاة تحديث واسترجاع البيانات من الخادم
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStats(mockStats);
    setLastUpdate(new Date());
    setLoading(false);
  };

  const exportReport = () => {
    // محاكاة تصدير التقرير
    alert('جاري تحضير التقرير للتصدير...');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
            إحصائيات البوت
          </h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على أداء البوت والنشاط
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshStats}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={exportReport} className="gap-2 bg-gradient-to-r from-gold to-yellow-600">
            <Download className="w-4 h-4" />
            تصدير تقرير
          </Button>
        </div>
      </motion.div>

      {!stats ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="glass-card h-[120px] flex justify-center flex-col">
                <CardHeader className="pb-2"><Skeleton className="h-4 w-1/2 bg-primary/10" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-1/3 mb-2 bg-primary/20" /><Skeleton className="h-3 w-1/4 bg-primary/10" /></CardContent>
              </Card>
            ))}
          </div>
          <Card className="glass-card"><CardHeader><Skeleton className="h-6 w-1/4 mb-2 bg-primary/10" /><Skeleton className="h-4 w-1/3 bg-primary/10" /></CardHeader><CardContent><Skeleton className="h-[100px] w-full bg-primary/5" /></CardContent></Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card"><CardHeader><Skeleton className="h-6 w-1/3 mb-2 bg-primary/10" /><Skeleton className="h-4 w-1/2 bg-primary/10" /></CardHeader><CardContent><Skeleton className="h-[300px] w-full bg-primary/5" /></CardContent></Card>
            <Card className="glass-card"><CardHeader><Skeleton className="h-6 w-1/3 mb-2 bg-primary/10" /><Skeleton className="h-4 w-1/2 bg-primary/10" /></CardHeader><CardContent><Skeleton className="h-[300px] w-full bg-primary/5" /></CardContent></Card>
          </div>
        </div>
      ) : (
        <>
          {/* Bot Status Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden glass-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ping</CardTitle>
              <Activity className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.bot.ping}ms</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.bot.ping < 50 ? 'ممتاز' : stats.bot.ping < 100 ? 'جيد' : 'ضعيف'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden glass-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.bot.uptime}</div>
              <p className="text-xs text-muted-foreground mt-1">
                منذ آخر تشغيل
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden glass-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">السيرفرات</CardTitle>
              <Server className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.bot.guilds.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +12 هذا الأسبوع
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden glass-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمين</CardTitle>
              <Users className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.bot.users.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +1,234 هذا الأسبوع
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Service Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              حالة الخدمات
            </CardTitle>
            <CardDescription>مراقبة حية لجميع خدمات البوت</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'التذاكر', icon: Ticket, status: 'active' },
                { name: 'الموسيقى', icon: Music, status: 'active' },
                { name: 'الاقتصاد', icon: Coins, status: 'active' },
                { name: 'المستويات', icon: TrendingUp, status: 'active' },
                { name: 'الإشراف', icon: Shield, status: 'active' },
                { name: 'الدردشة', icon: MessageSquare, status: 'active' }
              ].map((service, index) => (
                <div key={service.name} className="flex flex-col items-center p-4 rounded-lg bg-secondary/50">
                  <service.icon className="w-8 h-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">{service.name}</span>
                  <Badge 
                    variant={service.status === 'active' ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {service.status === 'active' ? 'نشط' : 'متوقف'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>النشاط الأسبوعي</CardTitle>
              <CardDescription>عدد الأوامر والرسائل والصوتية</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorCommands" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5865F2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#5865F2" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EB459E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EB459E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVoice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#57F287" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#57F287" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="commands" stroke="#5865F2" fillOpacity={1} fill="url(#colorCommands)" />
                  <Area type="monotone" dataKey="messages" stroke="#EB459E" fillOpacity={1} fill="url(#colorMessages)" />
                  <Area type="monotone" dataKey="voice" stroke="#57F287" fillOpacity={1} fill="url(#colorVoice)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>توزيع استخدام الخدمات</CardTitle>
              <CardDescription>نسبة استخدام كل خدمة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Commands & Tickets Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-500" />
                أكثر الأوامر استخداماً
              </CardTitle>
              <CardDescription>إجمالي {stats.commands.total.toLocaleString()} أمر مُنفذ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.commands.topCommands.map((cmd, index) => (
                  <div key={cmd.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{cmd.name}</span>
                    </div>
                    <Badge variant="secondary">{cmd.count.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tickets Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-green-500" />
                إحصائيات التذاكر
              </CardTitle>
              <CardDescription>آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">{stats.tickets.open}</div>
                  <div className="text-sm text-muted-foreground">تذاكر مفتوحة</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-500">{stats.tickets.closed.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">تذاكر مغلقة</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-500">{stats.tickets.today}</div>
                  <div className="text-sm text-muted-foreground">اليوم</div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-500">{stats.tickets.avgResponseTime}</div>
                  <div className="text-sm text-muted-foreground">متوسط الاستجابة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Last Update Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-between items-center text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>جميع الأنظمة تعمل بشكل طبيعي</span>
        </div>
        <div>
          آخر تحديث: {lastUpdate.toLocaleString('ar-SA')}
        </div>
      </motion.div>
        </>
      )}
    </div>
  );
}
