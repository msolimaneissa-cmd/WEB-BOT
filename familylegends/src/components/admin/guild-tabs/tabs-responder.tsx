import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Plus, 
  Trash2, 
  Reply 
} from 'lucide-react';

interface TabsResponderProps {
  responders: any[];
  newTrigger: string;
  setNewTrigger: (v: string) => void;
  newResponse: string;
  setNewResponse: (v: string) => void;
  newExact: boolean;
  setNewExact: (v: boolean) => void;
  handleAddResponder: () => void;
  handleDeleteResponder: (trigger: string) => void;
  addingResponder: boolean;
}

export const TabsResponder: React.FC<TabsResponderProps> = ({ 
  responders, 
  newTrigger, 
  setNewTrigger, 
  newResponse, 
  setNewResponse, 
  newExact, 
  setNewExact, 
  handleAddResponder, 
  handleDeleteResponder, 
  addingResponder 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Reply className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>نظام الردود التلقائية</CardTitle>
              <CardDescription>إضافة ردود تلقائية لكلمات محددة</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-white/5">
            <div className="space-y-2">
              <Label>الكلمة (Trigger)</Label>
              <Input
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                placeholder="مثال: السلام"
              />
            </div>
            <div className="space-y-2">
              <Label>الرد (Response)</Label>
              <Input
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="مثال: وعليكم السلام"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2 mb-2">
                <Switch
                  checked={newExact}
                  onCheckedChange={setNewExact}
                />
                <Label className="text-xs">مطابقة تامة</Label>
              </div>
              <Button
                onClick={handleAddResponder}
                disabled={addingResponder || !newTrigger || !newResponse}
                className="flex-1"
              >
                <Plus className="h-4 w-4 ml-1" /> إضافة
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>الردود الحالية ({responders.length})</Label>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow>
                    <TableHead className="text-right">الكلمة</TableHead>
                    <TableHead className="text-right">الرد</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        لا يوجد ردود تلقائية مضافة بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    responders.map((r) => (
                      <TableRow key={r._id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="font-bold">{r.trigger}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.response}</TableCell>
                        <TableCell>
                          <Badge variant={r.exact ? 'default' : 'outline'} className="text-[10px]">
                            {r.exact ? 'مطابقة تامة' : 'تحتوي على'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteResponder(r.trigger)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
