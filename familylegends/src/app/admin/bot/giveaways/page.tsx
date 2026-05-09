'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Gift, Clock, Users, Trophy, Plus, Play, Square, RotateCcw, CheckCircle,
  Trash2, Edit, Search, Filter, Calendar, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Giveaway {
  id: string;
  prize: string;
  winners: number;
  duration: string;
  participants: number;
  status: 'active' | 'ended' | 'cancelled';
  winner?: string;
  hostedBy: string;
  createdAt: string;
  endsAt: string;
}

const mockGiveaways: Giveaway[] = [
  {
    id: '1',
    prize: 'اشتراك Nitro لمدة سنة',
    winners: 1,
    duration: '7 أيام',
    participants: 234,
    status: 'active',
    hostedBy: 'Ahmed#1234',
    createdAt: '2024-04-10',
    endsAt: '2024-04-17'
  },
  {
    id: '2',
    prize: '50$ من متجر Steam',
    winners: 3,
    duration: '5 أيام',
    participants: 567,
    status: 'ended',
    winner: 'Sarah#5678',
    hostedBy: 'Admin',
    createdAt: '2024-04-01',
    endsAt: '2024-04-06'
  },
  {
    id: '3',
    prize: 'رتبة حصرية',
    winners: 2,
    duration: '3 أيام',
    participants: 189,
    status: 'ended',
    winner: 'Multiple',
    hostedBy: 'Mohamed#9012',
    createdAt: '2024-03-25',
    endsAt: '2024-03-28'
  }
];

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>(mockGiveaways);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGiveaway, setNewGiveaway] = useState({
    prize: '',
    winners: 1,
    duration: '1',
    durationUnit: 'days',
    requirements: '',
    roles: [] as string[]
  });

  const filteredGiveaways = giveaways.filter(giveaway => {
    const matchesSearch = giveaway.prize.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         giveaway.hostedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || giveaway.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateGiveaway = () => {
    const giveaway: Giveaway = {
      id: Date.now().toString(),
      prize: newGiveaway.prize,
      winners: newGiveaway.winners,
      duration: `${newGiveaway.duration} ${newGiveaway.durationUnit === 'days' ? 'أيام' : 'ساعات'}`,
      participants: 0,
      status: 'active',
      hostedBy: 'You',
      createdAt: new Date().toISOString().split('T')[0],
      endsAt: new Date(Date.now() + parseInt(newGiveaway.duration) * (newGiveaway.durationUnit === 'days' ? 24 : 1) * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    setGiveaways([giveaway, ...giveaways]);
    setIsCreateDialogOpen(false);
    setNewGiveaway({ prize: '', winners: 1, duration: '1', durationUnit: 'days', requirements: '', roles: [] });
  };

  const handleEndGiveaway = (id: string) => {
    setGiveaways(giveaways.map(g => 
      g.id === id ? { ...g, status: 'ended', winner: 'تم الاختيار' } : g
    ));
  };

  const handleRerollGiveaway = (id: string) => {
    alert(`تم إعادة اختيار الفائز للمسابقة ${id}`);
  };

  const handleDeleteGiveaway = (id: string) => {
    setGiveaways(giveaways.filter(g => g.id !== id));
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
            <Gift className="w-8 h-8" />
            إدارة المسابقات
          </h1>
          <p className="text-muted-foreground mt-1">
            إنشاء وإدارة المسابقات والجوائز
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500">
              <Plus className="w-4 h-4" />
              مسابقة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء مسابقة جديدة</DialogTitle>
              <DialogDescription>أدخل تفاصيل المسابقة الجديدة</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>الجائزة</Label>
                <Input 
                  placeholder="مثال: اشتراك Nitro لمدة سنة"
                  value={newGiveaway.prize}
                  onChange={(e) => setNewGiveaway({ ...newGiveaway, prize: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>عدد الفائزين</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={newGiveaway.winners}
                    onChange={(e) => setNewGiveaway({ ...newGiveaway, winners: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>المدة</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number"
                      min="1"
                      value={newGiveaway.duration}
                      onChange={(e) => setNewGiveaway({ ...newGiveaway, duration: e.target.value })}
                      className="w-20"
                    />
                    <select
                      value={newGiveaway.durationUnit}
                      onChange={(e) => setNewGiveaway({ ...newGiveaway, durationUnit: e.target.value })}
                      className="border rounded-md px-2 bg-background"
                    >
                      <option value="hours">ساعات</option>
                      <option value="days">أيام</option>
                      <option value="weeks">أسابيع</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>الشروط (اختياري)</Label>
                <Textarea 
                  placeholder="مثال: يجب أن يكون العضو في السيرفر منذ أسبوع"
                  value={newGiveaway.requirements}
                  onChange={(e) => setNewGiveaway({ ...newGiveaway, requirements: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateGiveaway} className="bg-gradient-to-r from-pink-500 to-purple-500">إنشاء</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المسابقات</CardTitle>
              <Gift className="w-4 h-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{giveaways.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نشطة</CardTitle>
              <Play className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{giveaways.filter(g => g.status === 'active').length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">منتهية</CardTitle>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{giveaways.filter(g => g.status === 'ended').length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المشاركين</CardTitle>
              <Users className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{giveaways.reduce((sum, g) => sum + g.participants, 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن مسابقة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="ended">منتهية</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Giveaways List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGiveaways.map((giveaway, index) => (
          <motion.div
            key={giveaway.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="glass-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-pink-500" />
                      {giveaway.prize}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      بواسطة: {giveaway.hostedBy}
                    </CardDescription>
                  </div>
                  <Badge variant={giveaway.status === 'active' ? 'default' : giveaway.status === 'ended' ? 'secondary' : 'destructive'}>
                    {giveaway.status === 'active' ? 'نشطة' : giveaway.status === 'ended' ? 'منتهية' : 'ملغاة'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{giveaway.participants} مشارك</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span>{giveaway.winners} فائز</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{giveaway.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>ينتهي: {giveaway.endsAt}</span>
                  </div>
                </div>

                {giveaway.winner && (
                  <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-green-500" />
                      <span className="font-medium">الفائز: {giveaway.winner}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  {giveaway.status === 'active' && (
                    <>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEndGiveaway(giveaway.id)}>
                        <Square className="w-4 h-4 ml-1" />
                        إنهاء
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                    </>
                  )}
                  {giveaway.status === 'ended' && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleRerollGiveaway(giveaway.id)}>
                      <RotateCcw className="w-4 h-4 ml-1" />
                      إعادة الاختيار
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteGiveaway(giveaway.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredGiveaways.length === 0 && (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center py-12">
            <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">لا توجد مسابقات</h3>
            <p className="text-muted-foreground">جرب تغيير معايير البحث أو أنشئ مسابقة جديدة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
