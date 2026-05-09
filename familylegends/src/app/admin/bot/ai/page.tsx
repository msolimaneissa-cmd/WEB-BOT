'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Brain, MessageSquare, Settings, Save, RefreshCw, 
  Trash2, Plus, History, Sparkles, Zap, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIConfigPage() {
  const [config, setConfig] = useState({
    enabled: true,
    model: 'gemini-pro',
    personality: 'مساعد ودود ومحترف',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    systemPrompt: 'أنت مساعد ذكي في سيرفر Family Legends. رد بطريقة ودودة ومحترفة.',
    allowedChannels: ['general', 'help', 'chat'],
    blockedUsers: [],
    cooldown: 5,
    nsfwFilter: true,
    logging: true
  });

  const [conversationHistory, setConversationHistory] = useState([
    { id: 1, user: 'Ahmed#1234', message: 'ما هي قواعد السيرفر؟', response: 'قواعد السيرفر تشمل...', timestamp: 'منذ 5 دقائق' },
    { id: 2, user: 'Sarah#5678', message: 'كيف أحصل على مستوى؟', response: 'للحصول على مستوى، يجب عليك...', timestamp: 'منذ 10 دقائق' },
    { id: 3, user: 'Mohamed#9012', message: 'من هو صاحب البوت؟', response: 'صاحب البوت هو...', timestamp: 'منذ 15 دقيقة' }
  ]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert('تم حفظ الإعدادات بنجاح!');
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <Brain className="w-8 h-8" />
            إعدادات الذكاء الاصطناعي
          </h1>
          <p className="text-muted-foreground mt-1">
            تكوين نموذج Gemini AI وتخصيص شخصية البوت
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500">
          <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </motion.div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حالة AI</CardTitle>
              <Zap className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={config.enabled ? 'default' : 'destructive'}>
                  {config.enabled ? 'نشط' : 'متوقف'}
                </Badge>
                <span className="text-xs text-muted-foreground">Gemini Pro</span>
              </div>
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
              <CardTitle className="text-sm font-medium">عدد المحادثات</CardTitle>
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversationHistory.length}</div>
              <p className="text-xs text-muted-foreground">اليوم</p>
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
              <CardTitle className="text-sm font-medium">متوسط الاستجابة</CardTitle>
              <Sparkles className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2s</div>
              <p className="text-xs text-muted-foreground">وقت الاستجابة</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
          <TabsTrigger value="personality" className="gap-2">
            <Bot className="w-4 h-4" />
            الشخصية
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            السجل
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  الإعدادات الأساسية
                </CardTitle>
                <CardDescription>تكوين نموذج الذكاء الاصطناعي والمعايير</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل الذكاء الاصطناعي</Label>
                    <p className="text-sm text-muted-foreground">السماح للمستخدمين بالتفاعل مع AI</p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>النموذج</Label>
                    <Select value={config.model} onValueChange={(value) => setConfig({ ...config, model: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                        <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الحد الأقصى للرموز (Tokens)</Label>
                    <Input
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>درجة الحرارة (Temperature)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={config.temperature}
                      onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">الإبداع: {config.temperature}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Top P</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={config.topP}
                      onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cooldown (ثواني)</Label>
                    <Input
                      type="number"
                      value={config.cooldown}
                      onChange={(e) => setConfig({ ...config, cooldown: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      تصفية المحتوى غير اللائق
                    </Label>
                    <p className="text-sm text-muted-foreground">منع الردود غير المناسبة</p>
                  </div>
                  <Switch
                    checked={config.nsfwFilter}
                    onCheckedChange={(checked) => setConfig({ ...config, nsfwFilter: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تسجيل المحادثات</Label>
                    <p className="text-sm text-muted-foreground">حفظ سجل المحادثات للمراجعة</p>
                  </div>
                  <Switch
                    checked={config.logging}
                    onCheckedChange={(checked) => setConfig({ ...config, logging: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  تخصيص الشخصية
                </CardTitle>
                <CardDescription>حدد كيفية تفاعل البوت مع المستخدمين</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>الشخصية الافتراضية</Label>
                  <Textarea
                    value={config.personality}
                    onChange={(e) => setConfig({ ...config, personality: e.target.value })}
                    rows={3}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <Textarea
                    value={config.systemPrompt}
                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                    rows={5}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    هذا النص يوجه سلوك الذكاء الاصطناعي ويحدد شخصيته
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>القنوات المسموحة</Label>
                  <div className="flex flex-wrap gap-2">
                    {config.allowedChannels.map((channel) => (
                      <Badge key={channel} variant="secondary" className="cursor-pointer">
                        #{channel}
                        <Trash2 
                          className="w-3 h-3 mr-1" 
                          onClick={() => setConfig({ 
                            ...config, 
                            allowedChannels: config.allowedChannels.filter(c => c !== channel) 
                          })}
                        />
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm" className="h-6">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  سجل المحادثات
                </CardTitle>
                <CardDescription>آخر التفاعلات مع الذكاء الاصطناعي</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversationHistory.map((conv) => (
                    <div key={conv.id} className="p-4 rounded-lg bg-secondary/50 border">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{conv.user}</Badge>
                        <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="text-sm font-medium text-blue-500">المستخدم:</span>
                          <span className="text-sm">{conv.message}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-sm font-medium text-green-500">AI:</span>
                          <span className="text-sm">{conv.response}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تحديث السجل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
