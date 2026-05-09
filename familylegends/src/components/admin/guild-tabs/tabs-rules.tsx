import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gavel, Plus, Trash2, Save, Loader2, ListOrdered, FileText } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Rule {
  _id: string;
  title: string;
  description: string;
  order: number;
}

interface TabsRulesProps {
  guildId?: string;
}

export const TabsRules: React.FC<TabsRulesProps> = ({ guildId: propGuildId }) => {
  const params = useParams() as { guildId?: string };
  const guildId = propGuildId || params?.guildId;
  const { toast } = useToast();
  
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // New Rule State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOrder, setNewOrder] = useState(0);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bot${guildId ? `/guilds/${guildId}` : ''}/rules`);
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Fetch rules error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [guildId]);

  const handleAddRule = async () => {
    if (!newTitle) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/bot${guildId ? `/guilds/${guildId}` : ''}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc, order: newOrder }),
      });
      if (res.ok) {
        toast({ title: 'تمت الإضافة', description: 'تم إضافة القانون بنجاح' });
        setNewTitle(''); setNewDesc(''); setNewOrder(rules.length + 1);
        fetchRules();
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إضافة القانون' });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/bot${guildId ? `/guilds/${guildId}` : ''}/rules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف القانون بنجاح' });
        fetchRules();
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في الحذف' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" /> قوانين السيرفر
          </h3>
          <p className="text-sm text-muted-foreground">قم بإدارة قائمة القوانين التي تظهر للأعضاء</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Rule Form */}
        <Card className="glass-card h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-500" /> إضافة قانون جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input 
                placeholder="مثال: يمنع السب والشتم" 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea 
                placeholder="تفاصيل القانون..." 
                value={newDesc} 
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-white/5 border-white/10 min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input 
                type="number" 
                value={newOrder} 
                onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <Button 
              onClick={handleAddRule} 
              disabled={adding || !newTitle}
              className="w-full bg-primary hover:bg-primary/80 text-black font-bold"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إضافة القانون'}
            </Button>
          </CardContent>
        </Card>

        {/* Rules List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
              <p className="text-muted-foreground">لا توجد قوانين حالياً</p>
            </div>
          ) : (
            rules.map((rule) => (
              <Card key={rule._id} className="glass-card overflow-hidden transition-all hover:border-primary/30">
                <div className="flex items-start justify-between p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {rule.order}
                    </div>
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {rule.title}
                      </h4>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{rule.description}</p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteRule(rule._id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
