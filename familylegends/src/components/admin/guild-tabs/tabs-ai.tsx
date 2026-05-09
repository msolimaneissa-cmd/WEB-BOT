import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Radio, 
  Save, 
  Bot, 
  MessageSquare 
} from 'lucide-react';

interface TabsAIProps {
  settings: any;
  updateField: (tab: string, field: string, value: any) => void;
  saveSettings: (tab: string) => void;
  saving: boolean;
}

export const TabsAI: React.FC<TabsAIProps> = ({ 
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
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Radio className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle>نظام الذكاء الاصطناعي (GenAI)</CardTitle>
                <CardDescription>إعداد الشات الذكي المدعوم بـ Google Gemini</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm">تفعيل النظام</Label>
              <Switch
                checked={settings.ai?.enabled ?? false}
                onCheckedChange={(v) => updateField('ai', 'enabled', v)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> قناة الذكاء الاصطناعي
              </Label>
              <Input
                value={settings.ai?.channelId || ''}
                onChange={(e) => updateField('ai', 'channelId', e.target.value)}
                placeholder="معرّف قناة الدردشة الذكية..."
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bot className="h-4 w-4" /> النموذج المستخدم (Model)
              </Label>
              <Select
                value={settings.ai?.model || 'gemini-1.5-flash'}
                onValueChange={(v) => updateField('ai', 'model', v)}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (سريع)</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (ذكي جداً)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>تعليمات النظام (System Prompt)</Label>
            <Textarea
              value={settings.ai?.systemPrompt || ''}
              onChange={(e) => updateField('ai', 'systemPrompt', e.target.value)}
              placeholder="حدد شخصية البوت وكيفية رده..."
              className="min-h-[120px]"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveSettings('ai')} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> حفظ إعدادات الذكاء الاصطناعي
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
