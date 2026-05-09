import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Wrench, 
  CloudSun, 
  Truck, 
  Moon, 
  Coins, 
  Save, 
  Loader2,
  Zap
} from 'lucide-react';

interface TabsServicesProps {
  settings: any;
  updateField: (section: string, field: string, value: any) => void;
  saveSettings: (section: string) => Promise<void>;
  saving: boolean;
}

export const TabsServices: React.FC<TabsServicesProps> = ({ settings, updateField, saveSettings, saving }) => {
  const services = settings?.services || {
    weather: true,
    delivery: true,
    prayer: true,
    currency: true
  };

  const handleToggle = (field: string, val: boolean) => {
    updateField('services', field, val);
  };

  const serviceList = [
    { 
      id: 'weather', 
      name: 'خدمة الطقس', 
      description: 'عرض حالة الطقس للمدن العربية والعالمية عبر أمر /weather', 
      icon: <CloudSun className="h-6 w-6 text-blue-400" /> 
    },
    { 
      id: 'delivery', 
      name: 'تتبع الشحنات', 
      description: 'متابعة حالة الشحنات من مختلف شركات التوصيل', 
      icon: <Truck className="h-6 w-6 text-orange-400" /> 
    },
    { 
      id: 'prayer', 
      name: 'مواقيت الصلاة', 
      description: 'عرض مواقيت الصلاة حسب المنطقة المحددة', 
      icon: <Moon className="h-6 w-6 text-green-400" /> 
    },
    { 
      id: 'currency', 
      name: 'محول العملات', 
      description: 'تحويل العملات بأسعار صرف مباشرة', 
      icon: <Coins className="h-6 w-6 text-yellow-400" /> 
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" /> الخدمات والأدوات
          </h3>
          <p className="text-sm text-muted-foreground">تحكم في الأدوات الإضافية التي يقدمها البوت للسيرفر</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceList.map((service) => (
          <Card key={service.id} className="glass-card overflow-hidden group hover:border-primary/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                    {service.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{service.name}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                      {service.description}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={services[service.id]} 
                  onCheckedChange={(val) => handleToggle(service.id, val)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => saveSettings('services')} 
          disabled={saving}
          className="bg-primary hover:bg-primary/80 text-black px-8 py-6 rounded-xl font-bold shadow-lg gap-2"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
};
