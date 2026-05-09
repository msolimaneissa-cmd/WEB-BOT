import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Save, 
  AlertTriangle, 
  Trash2,
  RefreshCw,
  Search,
  UserCheck
} from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';

interface TabsModProps {
  settings: any;
  warningStats: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: (tab: string) => void;
  saving: boolean;
  truncateId: (id: string) => string;
  formatDate: (date: string) => string;
}

export const TabsMod: React.FC<TabsModProps> = ({ 
  settings, 
  warningStats, 
  updateField, 
  saveSettings, 
  saving,
  truncateId,
  formatDate
}) => {
  const staffRoles = settings.mod.staffRoles || [];
  const [newStaffRole, setNewStaffRole] = React.useState('');

  const addStaffRole = () => {
    if (newStaffRole && !staffRoles.includes(newStaffRole)) {
      updateField('mod', 'staffRoles', [...staffRoles, newStaffRole]);
      setNewStaffRole('');
    }
  };

  const removeStaffRole = (roleId: string) => {
    updateField('mod', 'staffRoles', staffRoles.filter((id: string) => id !== roleId));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إعدادات الرتب واللوق */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> الرتب واللوق (Logs)
            </CardTitle>
            <CardDescription>تحديد صلاحيات المشرفين وقناة السجلات لتوثيق العمليات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رتبة المشرف (Mod Role)</Label>
                <Input
                  value={settings.mod.modRoleId}
                  onChange={(e) => updateField('mod', 'modRoleId', e.target.value)}
                  placeholder="معرّف الرتبة (ID)..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>رتبة الإدارة (Admin Role)</Label>
                <Input
                  value={settings.mod.adminRoleId}
                  onChange={(e) => updateField('mod', 'adminRoleId', e.target.value)}
                  placeholder="معرّف الرتبة (ID)..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رتبة الميوت (Muted Role)</Label>
                <Input
                  value={settings.mod.mutedRoleId}
                  onChange={(e) => updateField('mod', 'mutedRoleId', e.target.value)}
                  placeholder="معرّف الرتبة (ID)..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>قناة السجلات (Audit Logs)</Label>
                <Input
                  value={settings.mod.logChannelId}
                  onChange={(e) => updateField('mod', 'logChannelId', e.target.value)}
                  placeholder="معرّف القناة (ID)..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <Button onClick={() => saveSettings('mod')} disabled={saving} className="w-full gap-2 mt-2">
              <Save className="h-4 w-4" /> {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الرتب'}
            </Button>
          </CardContent>
        </Card>

        {/* صلاحيات الطاقم (Staff Permissions) */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" /> صلاحيات الطاقم (Bot Staff)
            </CardTitle>
            <CardDescription>تحديد الرتب الإضافية المسموح لها باستخدام أوامر البوت</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                placeholder="أدخل معرّف الرتبة (Role ID)..."
                className="font-mono text-xs"
              />
              <Button onClick={addStaffRole} size="sm" variant="secondary">
                إضافة
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg bg-white/5 border border-dashed border-white/10">
              {staffRoles.map((roleId: string) => (
                <Badge key={roleId} variant="outline" className="gap-1 bg-white/5 py-1 pr-1 pl-2">
                  <span className="font-mono text-[10px]">{roleId}</span>
                  <button onClick={() => removeStaffRole(roleId)} className="text-destructive hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {staffRoles.length === 0 && (
                <p className="text-[10px] text-muted-foreground m-auto">لا توجد رتب محددة حالياً</p>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              * ملاحظة: رتبة الإدارة (Admin Role) لها صلاحيات تلقائية.
            </p>
            <Button onClick={() => saveSettings('mod')} disabled={saving} variant="outline" className="w-full gap-2">
              <Save className="h-4 w-4" /> {saving ? 'جاري الحفظ...' : 'حفظ صلاحيات الطاقم'}
            </Button>
          </CardContent>
        </Card>

        {/* إعدادات العقوبات التلقائية */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" /> نظام العقوبات التلقائية (Auto Actions)
            </CardTitle>
            <CardDescription>تحديد الإجراءات الصارمة عند تكرار المخالفات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-white/5 hover:border-primary/20 transition-all">
                <div className="space-y-1">
                  <Label className="text-base">الحظر التلقائي (Auto Ban)</Label>
                  <p className="text-xs text-muted-foreground">حظر العضو فورياً عند استنفاد كافة التحذيرات المتاحة له.</p>
                </div>
                <Switch
                  checked={settings.mod.autoBan}
                  onCheckedChange={(v) => updateField('mod', 'autoBan', v)}
                />
              </div>
              <div className="space-y-3 p-4 border rounded-xl bg-white/5">
                <Label className="text-base">الحد الأقصى للتحذيرات (Warnings Limit)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={settings.mod.maxWarnings}
                    onChange={(e) => updateField('mod', 'maxWarnings', parseInt(e.target.value) || 0)}
                    className="w-24 font-bold text-lg bg-background"
                  />
                  <span className="text-sm text-muted-foreground">تحذير قبل اتخاذ إجراء الحظر النهائي</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => saveSettings('mod')} disabled={saving} className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold">
                <Save className="h-4 w-4" /> {saving ? 'جاري الحفظ...' : 'تحديث إعدادات العقوبات'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التحذيرات الأخيرة */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> التحذيرات النشطة ({warningStats?.total || 0})
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-destructive text-xs gap-1">
              <Trash2 className="h-3 w-3" /> مسح كل التحذيرات
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/5">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">المشرف</TableHead>
                  <TableHead className="text-right">السبب</TableHead>
                  <TableHead className="text-left">الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warningStats?.recent?.map((w: any) => (
                  <TableRow key={w._id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs">{truncateId(w.userId)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{w.moderatorTag}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{truncateId(w.moderatorId)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{w.reason}</TableCell>
                    <TableCell className="text-left text-[10px] text-muted-foreground">
                      {formatDate(w.timestamp || w.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!warningStats?.recent || warningStats.recent.length === 0) && (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                      لا توجد تحذيرات حالية في السيرفر
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
