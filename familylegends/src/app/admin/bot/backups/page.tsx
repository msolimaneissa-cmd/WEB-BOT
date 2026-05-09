'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Database, Download, Upload, RotateCcw, Clock, Calendar,
  HardDrive, CheckCircle, AlertCircle, Trash2, FileText,
  ArrowLeftToLine, Settings, Shield, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Backup {
  id: string;
  name: string;
  type: 'full' | 'partial' | 'settings' | 'roles' | 'channels';
  size: string;
  createdAt: string;
  createdBy: string;
  status: 'success' | 'failed' | 'pending';
  items: number;
}

const mockBackups: Backup[] = [
  {
    id: '1',
    name: 'نسخة كاملة - أبريل 2024',
    type: 'full',
    size: '25.4 MB',
    createdAt: '2024-04-15 14:30',
    createdBy: 'Ahmed#1234',
    status: 'success',
    items: 1250
  },
  {
    id: '2',
    name: 'إعدادات السيرفر',
    type: 'settings',
    size: '1.2 MB',
    createdAt: '2024-04-14 10:15',
    createdBy: 'Admin',
    status: 'success',
    items: 45
  },
  {
    id: '3',
    name: 'الأدوار والقنوات',
    type: 'roles',
    size: '3.8 MB',
    createdAt: '2024-04-13 16:45',
    createdBy: 'Sarah#5678',
    status: 'success',
    items: 89
  },
  {
    id: '4',
    name: 'نسخة فاشلة',
    type: 'full',
    size: '0 MB',
    createdAt: '2024-04-12 09:00',
    createdBy: 'System',
    status: 'failed',
    items: 0
  }
];

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>(mockBackups);
  const [isCreating, setIsCreating] = useState(false);
  const [backupType, setBackupType] = useState<'full' | 'partial'>('full');
  const [includeSettings, setIncludeSettings] = useState(true);
  const [includeRoles, setIncludeRoles] = useState(true);
  const [includeChannels, setIncludeChannels] = useState(true);
  const [includeMessages, setIncludeMessages] = useState(false);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newBackup: Backup = {
      id: Date.now().toString(),
      name: `نسخة ${backupType === 'full' ? 'كاملة' : 'جزئية'} - ${new Date().toLocaleDateString('ar-SA')}`,
      type: backupType,
      size: `${(Math.random() * 30 + 1).toFixed(1)} MB`,
      createdAt: new Date().toLocaleString('ar-SA'),
      createdBy: 'You',
      status: 'success',
      items: Math.floor(Math.random() * 1000) + 100
    };
    
    setBackups([newBackup, ...backups]);
    setIsCreating(false);
    alert('تم إنشاء النسخة الاحتياطية بنجاح!');
  };

  const handleRestoreBackup = (id: string) => {
    if (confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية.')) {
      alert(`جاري استعادة النسخة ${id}...`);
    }
  };

  const handleDownloadBackup = (backup: Backup) => {
    alert(`جاري تحميل النسخة: ${backup.name}`);
  };

  const handleDeleteBackup = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      setBackups(backups.filter(b => b.id !== id));
    }
  };

  const getBackupTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return 'كاملة';
      case 'partial': return 'جزئية';
      case 'settings': return 'إعدادات';
      case 'roles': return 'أدوار';
      case 'channels': return 'قنوات';
      default: return type;
    }
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-blue-500';
      case 'partial': return 'bg-purple-500';
      case 'settings': return 'bg-green-500';
      case 'roles': return 'bg-yellow-500';
      case 'channels': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent flex items-center gap-3">
            <Database className="w-8 h-8" />
            النسخ الاحتياطي والاستعادة
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة نسخ السيرفر الاحتياطية واستعادتها
          </p>
        </div>
        <Button 
          onClick={handleCreateBackup} 
          disabled={isCreating}
          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500"
        >
          <RotateCcw className={`w-4 h-4 ${isCreating ? 'animate-spin' : ''}`} />
          {isCreating ? 'جاري الإنشاء...' : 'نسخة جديدة'}
        </Button>
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
              <CardTitle className="text-sm font-medium">إجمالي النسخ</CardTitle>
              <Database className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backups.length}</div>
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
              <CardTitle className="text-sm font-medium">ناجحة</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backups.filter(b => b.status === 'success').length}</div>
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
              <CardTitle className="text-sm font-medium">الحجم الإجمالي</CardTitle>
              <HardDrive className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {backups.reduce((sum, b) => sum + parseFloat(b.size), 0).toFixed(1)} MB
              </div>
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
              <CardTitle className="text-sm font-medium">آخر نسخة</CardTitle>
              <Clock className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{backups[0]?.createdAt.split(' ')[1] || '-'}</div>
              <p className="text-xs text-muted-foreground">{backups[0]?.createdAt.split(' ')[0] || ''}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Backup Options */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            خيارات النسخة الاحتياطية
          </CardTitle>
          <CardDescription>حدد ما تريد تضمينه في النسخة الاحتياطية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>نوع النسخة</Label>
              <Select value={backupType} onValueChange={(v: any) => setBackupType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">كاملة (كل شيء)</SelectItem>
                  <SelectItem value="partial">جزئية (مخصص)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {backupType === 'partial' && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>الإعدادات</span>
                  </div>
                  <Switch checked={includeSettings} onCheckedChange={setIncludeSettings} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>الأدوار</span>
                  </div>
                  <Switch checked={includeRoles} onCheckedChange={setIncludeRoles} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>القنوات</span>
                  </div>
                  <Switch checked={includeChannels} onCheckedChange={setIncludeChannels} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>الرسائل (قد يكون الحجم كبير)</span>
                  </div>
                  <Switch checked={includeMessages} onCheckedChange={setIncludeMessages} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Backups List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">النسخ المتاحة</h2>
        {backups.map((backup, index) => (
          <motion.div
            key={backup.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg ${getBackupTypeColor(backup.type)} flex items-center justify-center`}>
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{backup.name}</h3>
                        <Badge variant={backup.status === 'success' ? 'default' : 'destructive'}>
                          {backup.status === 'success' ? 'ناجحة' : 'فاشلة'}
                        </Badge>
                        <Badge variant="outline">{getBackupTypeLabel(backup.type)}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {backup.createdAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {backup.size}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {backup.items.toLocaleString()} عنصر
                        </span>
                        <span>بواسطة: {backup.createdBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadBackup(backup)}
                      title="تحميل"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {backup.status === 'success' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleRestoreBackup(backup.id)}
                          title="استعادة"
                        >
                          <ArrowLeftToLine className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteBackup(backup.id)}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {backups.length === 0 && (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center py-12">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">لا توجد نسخ احتياطية</h3>
            <p className="text-muted-foreground">أنشئ نسختك الاحتياطية الأولى الآن</p>
            <Button onClick={handleCreateBackup} className="mt-4">
              <RotateCcw className="w-4 h-4 ml-2" />
              إنشاء نسخة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
