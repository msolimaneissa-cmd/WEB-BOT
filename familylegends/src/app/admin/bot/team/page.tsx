'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, Shield, Plus, Trash2, Edit, Search, Filter,
  Crown, Star, Clock, Activity, CheckCircle, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TeamMember {
  id: string;
  name: string;
  discordId: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'developer';
  permissions: string[];
  joinedAt: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'banned';
}

const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Ahmed',
    discordId: 'ahmed#1234',
    role: 'owner',
    permissions: ['all'],
    joinedAt: '2024-01-15',
    lastActive: 'الآن',
    status: 'active'
  },
  {
    id: '2',
    name: 'Sarah',
    discordId: 'sarah#5678',
    role: 'admin',
    permissions: ['manage_guild', 'manage_roles', 'kick_members', 'ban_members'],
    joinedAt: '2024-02-20',
    lastActive: 'منذ 5 دقائق',
    status: 'active'
  },
  {
    id: '3',
    name: 'Mohamed',
    discordId: 'mohamed#9012',
    role: 'developer',
    permissions: ['manage_bot', 'view_logs'],
    joinedAt: '2024-03-10',
    lastActive: 'منذ ساعة',
    status: 'active'
  },
  {
    id: '4',
    name: 'Khaled',
    discordId: 'khaled#3456',
    role: 'moderator',
    permissions: ['kick_members', 'timeout_members'],
    joinedAt: '2024-04-05',
    lastActive: 'منذ يوم',
    status: 'inactive'
  }
];

const permissionsList = [
  { id: 'all', name: 'جميع الصلاحيات', description: 'وصول كامل لكل الميزات' },
  { id: 'manage_guild', name: 'إدارة السيرفر', description: 'تعديل إعدادات السيرفر' },
  { id: 'manage_roles', name: 'إدارة الأدوار', description: 'إنشاء وحذف الأدوار' },
  { id: 'manage_bot', name: 'إدارة البوت', description: 'تحكم في إعدادات البوت' },
  { id: 'kick_members', name: 'طرد الأعضاء', description: 'طرد المستخدمين من السيرفر' },
  { id: 'ban_members', name: 'حظر الأعضاء', description: 'حظر المستخدمين من السيرفر' },
  { id: 'timeout_members', name: 'كتم الأعضاء', description: 'كتم المستخدمين مؤقتاً' },
  { id: 'view_logs', name: 'عرض السجلات', description: 'الاطلاع على سجلات البوت' }
];

export default function BotTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    role: 'moderator',
    permissions: []
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.discordId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'admin': return 'bg-gradient-to-r from-red-500 to-pink-500';
      case 'developer': return 'bg-gradient-to-r from-blue-500 to-purple-500';
      case 'moderator': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'developer': return <Star className="w-4 h-4" />;
      case 'moderator': return <Activity className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const handleAddMember = () => {
    const member: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name || 'Unknown',
      discordId: newMember.discordId || 'unknown#0000',
      role: newMember.role as any || 'moderator',
      permissions: newMember.permissions || [],
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: 'الآن',
      status: 'active'
    };
    setMembers([...members, member]);
    setIsAddDialogOpen(false);
    setNewMember({ role: 'moderator', permissions: [] });
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="w-8 h-8" />
            فريق البوت
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة صلاحيات فريق العمل والمستويات
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus className="w-4 h-4" />
              إضافة عضو
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة عضو جديد للفريق</DialogTitle>
              <DialogDescription>أدخل معلومات العضو وحدد الصلاحيات</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>اسم المستخدم</Label>
                <Input 
                  placeholder="Ahmed"
                  value={newMember.name || ''}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Discord ID</Label>
                <Input 
                  placeholder="ahmed#1234"
                  value={newMember.discordId || ''}
                  onChange={(e) => setNewMember({ ...newMember, discordId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>الرتبة</Label>
                <Select 
                  value={newMember.role} 
                  onValueChange={(value: any) => setNewMember({ ...newMember, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">مشرف</SelectItem>
                    <SelectItem value="developer">مطور</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>الصلاحيات</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                  {permissionsList.map((perm) => (
                    <label key={perm.id} className="flex items-center space-x-2 p-2 rounded hover:bg-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMember.permissions?.includes(perm.id)}
                        onChange={(e) => {
                          const perms = newMember.permissions || [];
                          if (e.target.checked) {
                            setNewMember({ ...newMember, permissions: [...perms, perm.id] });
                          } else {
                            setNewMember({ ...newMember, permissions: perms.filter(p => p !== perm.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <div>
                        <div className="text-sm font-medium">{perm.name}</div>
                        <div className="text-xs text-muted-foreground">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleAddMember} className="bg-gradient-to-r from-blue-500 to-purple-500">إضافة</Button>
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
              <CardTitle className="text-sm font-medium">إجمالي الفريق</CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
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
              <CardTitle className="text-sm font-medium">نشطون</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.filter(m => m.status === 'active').length}</div>
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
              <CardTitle className="text-sm font-medium">مدراء</CardTitle>
              <Shield className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.filter(m => m.role === 'admin' || m.role === 'owner').length}</div>
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
              <CardTitle className="text-sm font-medium">مشرفين</CardTitle>
              <Activity className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.filter(m => m.role === 'moderator').length}</div>
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
                  placeholder="بحث عن عضو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب الرتبة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="owner">مالك</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="developer">مطور</SelectItem>
                  <SelectItem value="moderator">مشرف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <div className="grid gap-4">
        {filteredMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="mr-1">
                            {member.role === 'owner' ? 'مالك' : 
                             member.role === 'admin' ? 'مدير' : 
                             member.role === 'developer' ? 'مطور' : 'مشرف'}
                          </span>
                        </Badge>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.discordId}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          انضم: {member.joinedAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          آخر نشاط: {member.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {member.role !== 'owner' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Permissions */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium mb-2">الصلاحيات:</div>
                  <div className="flex flex-wrap gap-2">
                    {member.permissions.includes('all') ? (
                      <Badge variant="default">جميع الصلاحيات</Badge>
                    ) : (
                      member.permissions.map((perm) => {
                        const permInfo = permissionsList.find(p => p.id === perm);
                        return permInfo ? (
                          <Badge key={perm} variant="secondary">
                            {permInfo.name}
                          </Badge>
                        ) : null;
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">لا يوجد أعضاء</h3>
            <p className="text-muted-foreground">جرب تغيير معايير البحث أو التصفية</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
