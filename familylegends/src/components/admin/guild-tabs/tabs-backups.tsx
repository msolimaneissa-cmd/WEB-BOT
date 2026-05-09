import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Archive, 
  RefreshCw, 
  Plus, 
  Trash2 
} from 'lucide-react';

interface TabsBackupsProps {
  backups: any[];
  creatingBackup: boolean;
  handleCreateBackup: () => void;
  formatDate: (date: string) => string;
}

export const TabsBackups: React.FC<TabsBackupsProps> = ({ 
  backups, 
  creatingBackup, 
  handleCreateBackup, 
  formatDate 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Archive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>النسخ الاحتياطي للسيرفر</CardTitle>
                <CardDescription>إنشاء واستعادة نسخ احتياطية للقنوات والرتب</CardDescription>
              </div>
            </div>
            <Button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="gap-2"
            >
              {creatingBackup ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              إنشاء نسخة جديدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>النسخ المتوفرة ({backups.length})</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {backups.map((b) => (
                <div key={b.backupId} className="p-4 border rounded-lg bg-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-xs text-primary">{b.backupId}</p>
                      <p className="text-sm font-bold mt-1">{formatDate(b.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {b.size || '---'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs" disabled>
                      استعادة
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {backups.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
                  لا توجد نسخ احتياطية مسجلة حالياً
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
