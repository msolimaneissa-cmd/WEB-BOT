import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  RefreshCw, 
  Plus, 
  Users 
} from 'lucide-react';

interface TabsGiveawaysProps {
  giveaways: any[];
  formatDate: (date: string) => string;
}

export const TabsGiveaways: React.FC<TabsGiveawaysProps> = ({ 
  giveaways, 
  formatDate 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle>إدارة الهبات (Giveaways)</CardTitle>
                <CardDescription>إنشاء ومتابعة المسابقات في السيرفر</CardDescription>
              </div>
            </div>
            <Button onClick={() => {}} className="gap-2 bg-yellow-600 hover:bg-yellow-700">
              <Plus className="h-4 w-4" /> إنشاء هبة جديدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>الهبات النشطة ({giveaways.length})</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {giveaways.map((g) => (
                <div key={g._id} className="p-5 border rounded-xl bg-white/5 space-y-4 hover:bg-white/10 transition-all border-white/10 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="h-12 w-12" />
                  </div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="font-bold text-xl text-yellow-500">{g.prize}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                         <RefreshCw className="h-3 w-3 animate-spin-slow" /> 
                         تنتهي: {formatDate(g.endAt)}
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-none">نشطة</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-2 relative z-10">
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">الفائزين</p>
                      <p className="font-bold">{g.winners}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">المشاركين</p>
                      <p className="font-bold">{g.entries?.length || 0}</p>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground relative z-10">
                    <Users className="h-3 w-3" />
                    <span>بواسطة: {g.hostTag || g.hostId}</span>
                  </div>
                  
                  <div className="flex gap-2 relative z-10">
                    <Button variant="secondary" size="sm" className="flex-1 gap-1 text-xs h-9" disabled>
                      إغلاق مبكر
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs h-9" disabled>
                      إعادة سحب
                    </Button>
                  </div>
                </div>
              ))}
              {giveaways.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-white/5 rounded-2xl border border-white/10 border-dashed transition-all hover:bg-white/10">
                  <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 relative drop-shadow-lg">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping opacity-20" />
                    <Trophy className="h-10 w-10 text-yellow-500/60" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">لا توجد هبات نشطة</h3>
                  <p className="text-sm text-center max-w-sm mb-6 leading-relaxed">
                    لا توجد مسابقات أو سحوبات مفعلة حالياً. يمكنك تفعيل مسابقة جديدة لتنشيط السيرفر وجذب الأعضاء عبر استخدام أمر <code className="bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded mx-1">/هبة بدء</code>
                  </p>
                  <Button variant="outline" className="gap-2 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" disabled>
                    <Plus className="h-4 w-4" /> إنشاء هبة سريعة (قريباً)
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
