import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Save, 
  Plus, 
  X, 
  ShoppingBag, 
  Coins, 
  Landmark 
} from 'lucide-react';

interface TabsEconomyProps {
  settings: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: (tab: string) => void;
  saving: boolean;
}

export const TabsEconomy: React.FC<TabsEconomyProps> = ({ 
  settings, 
  updateField, 
  saveSettings, 
  saving 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle>النظام الاقتصادي</CardTitle>
                <CardDescription>تخصيص العملات، المكافآت اليومية، والمتجر</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm">تفعيل النظام</Label>
              <Switch
                checked={settings.economy.enabled}
                onCheckedChange={(v) => updateField('economy', 'enabled', v)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>اسم العملة (Currency Name)</Label>
              <Input
                value={settings.economy.currencyName}
                onChange={(e) => updateField('economy', 'currencyName', e.target.value)}
                placeholder="مثال: ريال، عملة، نقاط..."
              />
            </div>
            <div className="space-y-2">
              <Label>رمز العملة (Emoji)</Label>
              <Input
                value={settings.economy.currencyEmoji}
                onChange={(e) => updateField('economy', 'currencyEmoji', e.target.value)}
                placeholder="مثال: 💰، 🪙، 💎..."
              />
            </div>
          </div>

          <Separator className="bg-white/5" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-400" /> المكافأة اليومية (Daily)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأدنى</Label>
                  <Input
                    type="number"
                    value={settings.economy.dailyMin}
                    onChange={(e) => updateField('economy', 'dailyMin', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى</Label>
                  <Input
                    type="number"
                    value={settings.economy.dailyMax}
                    onChange={(e) => updateField('economy', 'dailyMax', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Landmark className="h-4 w-4 text-blue-400" /> مكافأة العمل (Work)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأدنى</Label>
                  <Input
                    type="number"
                    value={settings.economy.workMin}
                    onChange={(e) => updateField('economy', 'workMin', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى</Label>
                  <Input
                    type="number"
                    value={settings.economy.workMax}
                    onChange={(e) => updateField('economy', 'workMax', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveSettings('economy')} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> حفظ إعدادات الاقتصاد
            </Button>
          </div>

          <Separator className="bg-white/5" />

          {/* إدارة عناصر المتجر */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" /> إدارة عناصر المتجر المخصصة
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const newItems = [...(settings.economy?.shopItems || [])];
                  newItems.push({ id: `item_${Date.now()}`, name: 'عنصر جديد', price: 1000, emoji: '📦', description: '' });
                  updateField('economy', 'shopItems', newItems);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> إضافة عنصر
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(settings.economy?.shopItems || []).map((item: any, idx: number) => (
                <div key={idx} className="p-4 border border-white/5 rounded-xl bg-white/[0.02] space-y-4 relative group hover:border-primary/20 transition-all duration-300">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const newItems = settings.economy.shopItems.filter((_: any, i: number) => i !== idx);
                      updateField('economy', 'shopItems', newItems);
                    }}
                    className="absolute top-2 left-2 h-7 w-7 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 bg-white/5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">الرمز</Label>
                      <Input 
                        value={item.emoji} 
                        onChange={(e) => {
                          const newItems = [...settings.economy.shopItems];
                          newItems[idx].emoji = e.target.value;
                          updateField('economy', 'shopItems', newItems);
                        }}
                        className="h-9 text-center bg-white/[0.03]"
                      />
                    </div>
                    <div className="col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">اسم العنصر</Label>
                      <Input 
                        value={item.name} 
                        onChange={(e) => {
                          const newItems = [...settings.economy.shopItems];
                          newItems[idx].name = e.target.value;
                          updateField('economy', 'shopItems', newItems);
                        }}
                        className="h-9 text-xs bg-white/[0.03]"
                      />
                    </div>
                    <div className="col-span-4 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">السعر</Label>
                      <Input 
                        type="number"
                        value={item.price} 
                        onChange={(e) => {
                          const newItems = [...settings.economy.shopItems];
                          newItems[idx].price = parseInt(e.target.value) || 0;
                          updateField('economy', 'shopItems', newItems);
                        }}
                        className="h-9 text-xs font-mono bg-white/[0.03]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">الوصف</Label>
                      <Input 
                        value={item.description} 
                        onChange={(e) => {
                          const newItems = [...settings.economy.shopItems];
                          newItems[idx].description = e.target.value;
                          updateField('economy', 'shopItems', newItems);
                        }}
                        placeholder="وصف العنصر..."
                        className="h-9 text-xs bg-white/[0.03]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">رتبة مكافأة (Role ID)</Label>
                      <Input 
                        value={item.roleId || ''} 
                        onChange={(e) => {
                          const newItems = [...settings.economy.shopItems];
                          newItems[idx].roleId = e.target.value;
                          updateField('economy', 'shopItems', newItems);
                        }}
                        placeholder="اتركه فارغاً إذا لم يكن رتبة"
                        className="h-9 text-xs font-mono bg-white/[0.03]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(settings.economy?.shopItems || []).length === 0 && (
                <div className="col-span-full py-10 text-center border border-dashed rounded-xl bg-white/5 text-muted-foreground text-sm">
                  يتم استخدام العناصر الافتراضية حالياً. أضف عناصر مخصصة لاستبدالها.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
