import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  Plus, 
  X, 
  Send, 
  RefreshCw 
} from 'lucide-react';

interface TabsRRProps {
  newRRChannel: string;
  setNewRRChannel: (v: string) => void;
  newRRTitle: string;
  setNewRRTitle: (v: string) => void;
  newRRDesc: string;
  setNewRRDesc: (v: string) => void;
  newRRRoles: any[];
  setNewRRRoles: (v: any[]) => void;
  handleAddRRRole: () => void;
  handleCreateRR: () => void;
  creatingRR: boolean;
}

export const TabsRR: React.FC<TabsRRProps> = ({ 
  newRRChannel, 
  setNewRRChannel, 
  newRRTitle, 
  setNewRRTitle, 
  newRRDesc, 
  setNewRRDesc, 
  newRRRoles, 
  setNewRRRoles, 
  handleAddRRRole, 
  handleCreateRR, 
  creatingRR 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>منشئ رسائل الرتب التفاعلية</CardTitle>
              <CardDescription>إرسال رسالة تحتوي على أزرار لمنح الرتب للأعضاء</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>قناة الإرسال</Label>
                <Input
                  value={newRRChannel}
                  onChange={(e) => setNewRRChannel(e.target.value)}
                  placeholder="معرّف القناة (Channel ID)..."
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>عنوان الرسالة</Label>
                <Input
                  value={newRRTitle}
                  onChange={(e) => setNewRRTitle(e.target.value)}
                  placeholder="مثال: اختر رتبك المفضلة"
                />
              </div>
              <div className="space-y-2">
                <Label>وصف الرسالة</Label>
                <Textarea
                  value={newRRDesc}
                  onChange={(e) => setNewRRDesc(e.target.value)}
                  placeholder="صف الرتب وكيفية الحصول عليها..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>الأدوار والأزرار ({newRRRoles.length})</Label>
                <Button variant="outline" size="sm" onClick={handleAddRRRole} className="h-8 gap-1">
                  <Plus className="h-3 w-3" /> إضافة زر
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {newRRRoles.map((role, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-white/5 space-y-3 relative">
                    <button 
                      onClick={() => setNewRRRoles(newRRRoles.filter((_, i) => i !== idx))}
                      className="absolute top-2 left-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">معرف الرتبة</Label>
                        <Input 
                          value={role.roleId} 
                          onChange={(e) => {
                            const updated = [...newRRRoles];
                            updated[idx].roleId = e.target.value;
                            setNewRRRoles(updated);
                          }}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">نص الزر</Label>
                        <Input 
                          value={role.label} 
                          onChange={(e) => {
                            const updated = [...newRRRoles];
                            updated[idx].label = e.target.value;
                            setNewRRRoles(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {newRRRoles.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4 italic">
                    لم يتم إضافة أي أزرار بعد
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <Button 
              onClick={handleCreateRR} 
              disabled={creatingRR || !newRRChannel || !newRRTitle || newRRRoles.length === 0}
              className="gap-2"
            >
              {creatingRR ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              إرسال رسالة الرتب للسيرفر
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
