import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Search, 
  Edit, 
  RotateCcw, 
  Star, 
  Users 
} from 'lucide-react';

interface TabsMembersProps {
  members: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  openEditDialog: (member: any) => void;
  openResetDialog: (member: any) => void;
  openBadgesDialog: (member: any) => void;
  truncateId: (id: string) => string;
}

export const TabsMembers: React.FC<TabsMembersProps> = ({ 
  members, 
  searchQuery, 
  setSearchQuery, 
  openEditDialog, 
  openResetDialog, 
  openBadgesDialog,
  truncateId
}) => {
  const filteredMembers = members.filter(m => 
    m.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>إدارة أعضاء السيرفر</CardTitle>
                <CardDescription>عرض وتعديل بيانات الاقتصاد والمستويات للأعضاء</CardDescription>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن عضو (ID)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-9 bg-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader className="bg-white/5">
                <TableRow>
                  <TableHead className="text-right w-32">العضو</TableHead>
                  <TableHead className="text-right w-36">الاقتصاد</TableHead>
                  <TableHead className="text-right w-28">المستوى</TableHead>
                  <TableHead className="text-right w-40">الأوسمة</TableHead>
                  <TableHead className="text-left w-28">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((m) => (
                  <TableRow key={m.userId} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs">{truncateId(m.userId)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-green-500 font-bold">💰 {m.balance?.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground">🏦 {m.bank?.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px] font-bold">Lvl {m.level}</Badge>
                        <span className="text-[9px] text-muted-foreground">{m.xp} XP</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {m.badges?.map((b: any, i: number) => (
                          <span key={i} title={b.name}>{b.emoji}</span>
                        )) || '---'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(m)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openBadgesDialog(m)} className="h-8 w-8 hover:bg-yellow-500/10 hover:text-yellow-500">
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openResetDialog(m)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Users className="w-10 h-10 opacity-20" />
                        <p className="text-sm">{searchQuery ? 'لا يوجد أعضاء مطابقين لكلمة البحث' : 'لا يوجد أعضاء حتى الآن'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
