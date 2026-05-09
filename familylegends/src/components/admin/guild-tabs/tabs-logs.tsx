import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  Activity as ActivityIcon, 
  RefreshCw, 
  Archive,
  Save
} from 'lucide-react';

interface TabsLogsProps {
  settings: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: (tab: string) => void;
  saving: boolean;
  logs: any[];
  fetchData: () => void;
  truncateId: (id: string) => string;
  formatDate: (date: string) => string;
}

export const TabsLogs: React.FC<TabsLogsProps> = ({ 
  settings,
  updateField,
  saveSettings,
  saving,
  logs, 
  fetchData, 
  truncateId, 
  formatDate 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <ActivityIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <CardTitle>سجل أحداث السيرفر (Audit Logs)</CardTitle>
                <CardDescription>مراقبة العمليات التي تمت عبر البوت في هذا السيرفر</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className="h-4 w-4" /> تحديث السجل
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* إعدادات قناة السجلات */}
          <div className="p-4 border rounded-lg bg-white/5 space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
               قناة إرسال السجلات (Logging Channel)
            </h4>
            <div className="flex gap-2">
              <Input
                value={(settings as any)?.mod?.logChannelId || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('mod', 'logChannelId', e.target.value)}
                placeholder="معرّف القناة (Channel ID)..."
                className="font-mono text-xs bg-background"
              />
              <Button 
                size="sm" 
                onClick={() => saveSettings('mod')}
                disabled={saving}
                className="gap-2 shrink-0"
              >
                <Save className="h-4 w-4" /> حفظ القناة
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              * سيتم إرسال كافة أحداث السيرفر (الحذف، الطرد، الرتب، إلخ) إلى هذه القناة.
            </p>
          </div>

          <div className="rounded-md border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-right">الحدث</TableHead>
                  <TableHead className="text-right">بواسطة</TableHead>
                  <TableHead className="text-right">التفاصيل</TableHead>
                  <TableHead className="text-left">الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-bold">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {log.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.executorTag || 'System'}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{truncateId(log.executorId || '')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {log.reason || log.metadata?.details || '---'}
                    </TableCell>
                    <TableCell className="text-left text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Archive className="h-8 w-8 opacity-20" />
                        <p>لا توجد سجلات متاحة حالياً للعرض</p>
                      </div>
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
