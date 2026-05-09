import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Layout, 
  Send, 
  RefreshCw, 
  Eye 
} from 'lucide-react';

interface TabsEmbedProps {
  embedChannelId: string;
  setEmbedChannelId: (v: string) => void;
  embedTitle: string;
  setEmbedTitle: (v: string) => void;
  embedDescription: string;
  setEmbedDescription: (v: string) => void;
  embedContent: string;
  setEmbedContent: (v: string) => void;
  embedColor: string;
  setEmbedColor: (v: string) => void;
  handleSendEmbed: () => void;
  sendingEmbed: boolean;
}

export const TabsEmbed: React.FC<TabsEmbedProps> = ({ 
  embedChannelId, 
  setEmbedChannelId, 
  embedTitle, 
  setEmbedTitle, 
  embedDescription, 
  setEmbedDescription, 
  embedContent, 
  setEmbedContent, 
  embedColor, 
  setEmbedColor, 
  handleSendEmbed, 
  sendingEmbed 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* محرّر الـ Embed */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layout className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>محرّر الرسائل المتقدم (Embed)</CardTitle>
                <CardDescription>إنشاء رسائل احترافية وإرسالها للسيرفر</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>قناة الإرسال (Channel ID)</Label>
              <Input
                value={embedChannelId}
                onChange={(e) => setEmbedChannelId(e.target.value)}
                placeholder="أدخل معرّف القناة..."
                className="font-mono"
              />
            </div>
            <Separator className="bg-white/5" />
            <div className="space-y-2">
              <Label>محتوى الرسالة (خارج الـ Embed)</Label>
              <Input
                value={embedContent}
                onChange={(e) => setEmbedContent(e.target.value)}
                placeholder="منشن، رابط، أو نص عادي..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عنوان الـ Embed</Label>
                <Input
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  placeholder="عنوان الرسالة الرئيسي"
                />
              </div>
              <div className="space-y-2">
                <Label>لون الشريط الجانبي</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={embedColor}
                    onChange={(e) => setEmbedColor(e.target.value)}
                    className="w-12 p-1 h-10"
                  />
                  <Input
                    value={embedColor}
                    onChange={(e) => setEmbedColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>وصف الـ Embed</Label>
              <Textarea
                value={embedDescription}
                onChange={(e) => setEmbedDescription(e.target.value)}
                placeholder="محتوى الرسالة التفصيلي..."
                className="min-h-[150px]"
              />
            </div>
            <Button
              onClick={handleSendEmbed}
              disabled={sendingEmbed || !embedChannelId || !embedTitle}
              className="w-full gap-2"
            >
              {sendingEmbed ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              إرسال الرسالة الآن
            </Button>
          </CardContent>
        </Card>

        {/* المعاينة الحية */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> معاينة حية (Live Preview)
          </Label>
          <div className="space-y-2">
            {embedContent && <p className="text-sm text-white/90">{embedContent}</p>}
            <div 
              className="border-r-4 rounded-md bg-[#2b2d31] p-4 space-y-2 shadow-xl"
              style={{ borderRightColor: embedColor }}
            >
              <h4 className="font-bold text-white text-base">{embedTitle || 'عنوان الرسالة'}</h4>
              <p className="text-sm text-[#dbdee1] whitespace-pre-wrap leading-relaxed">
                {embedDescription || 'سيظهر وصف الرسالة هنا... يمكنك استخدام Markdown.'}
              </p>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="text-[10px] text-blue-400">
              * ملاحظة: هذه المعاينة تقريبية لما سيظهر في تطبيق Discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
