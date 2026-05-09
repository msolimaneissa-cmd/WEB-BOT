'use client';

import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Partner, Rule, TeamMember, Streamer, AudioTrack } from '@/lib/data';
import { useTranslations } from 'next-intl';

type DialogType = 'partner' | 'file' | 'rule' | 'teamMember' | 'streamer' | 'audioTrack';
type ItemType = 'partner' | 'file' | 'rule' | 'teamMember' | 'streamer' | 'audioTrack';

interface FileItem {
  id: string;
  fileName: string;
  fileUrl: string;
  iconClass: string;
  timestamp: string;
}

interface AdminDialogsProps {
  dialogs: Record<DialogType, boolean>;
  closeDialog: (type: DialogType) => void;
  currentPartner: Partial<Partner> | null;
  setCurrentPartner: (v: Partial<Partner> | null) => void;
  currentFile: Partial<FileItem> | null;
  setCurrentFile: (v: Partial<FileItem> | null) => void;
  currentRule: Partial<Rule> | null;
  setCurrentRule: (v: Partial<Rule> | null) => void;
  currentTeamMember: Partial<TeamMember> | null;
  setCurrentTeamMember: (v: Partial<TeamMember> | null) => void;
  currentStreamer: Partial<Streamer> | null;
  setCurrentStreamer: (v: Partial<Streamer> | null) => void;
  currentAudioTrack: Partial<AudioTrack> | null;
  setCurrentAudioTrack: (v: Partial<AudioTrack> | null) => void;
  handleSave: (type: ItemType, currentItem: any) => Promise<void>;
  isDeleteDialogOpen: boolean;
  setDeleteDialogOpen: (v: boolean) => void;
  itemToDelete: { id: string; type: ItemType } | null;
  handleDelete: () => Promise<void>;
}

export function AdminDialogs({
  dialogs, closeDialog,
  currentPartner, setCurrentPartner,
  currentFile, setCurrentFile,
  currentRule, setCurrentRule,
  currentTeamMember, setCurrentTeamMember,
  currentStreamer, setCurrentStreamer,
  currentAudioTrack, setCurrentAudioTrack,
  handleSave,
  isDeleteDialogOpen, setDeleteDialogOpen,
  itemToDelete, handleDelete,
}: AdminDialogsProps) {
  const t = useTranslations('Admin');
  const tc = useTranslations('Common');

  const renderSocialFields = (value: Record<string, string> | undefined, onChange: (v: Record<string, string>) => void) => (
    <div className="grid grid-cols-2 gap-3">
      {['twitter', 'discord', 'twitch', 'youtube', 'instagram', 'facebook'].map((platform) => (
        <div key={platform} className="space-y-1">
          <Label className="text-xs text-muted-foreground capitalize">{platform}</Label>
          <Input value={value?.[platform] || ''} onChange={(e) => onChange({ ...value, [platform]: e.target.value })} className="rounded-xl border-white/10 bg-white/5 h-9 text-sm ltr" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Partner Dialog */}
      <Dialog open={dialogs.partner} onOpenChange={(v) => !v && closeDialog('partner')}>
        <DialogContent className="glass border-white/10 rounded-3xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gradient-gold">{t('dialogs.addEditPartner')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4" dir="rtl">
            <div className="space-y-2"><Label>اسم الحليف</Label><Input value={currentPartner?.name || ''} onChange={e => setCurrentPartner({ ...currentPartner, name: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>رابط الشعار</Label><Input value={currentPartner?.logoUrl || ''} onChange={e => setCurrentPartner({ ...currentPartner, logoUrl: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="space-y-2"><Label>رابط الدعوة</Label><Input value={currentPartner?.inviteUrl || ''} onChange={e => setCurrentPartner({ ...currentPartner, inviteUrl: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="space-y-2"><Label>اسم المالك</Label><Input value={currentPartner?.ownerName || ''} onChange={e => setCurrentPartner({ ...currentPartner, ownerName: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>رابط المالك</Label><Input value={currentPartner?.ownerUrl || ''} onChange={e => setCurrentPartner({ ...currentPartner, ownerUrl: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="space-y-2"><Label>رابط البث</Label><Input value={currentPartner?.streamUrl || ''} onChange={e => setCurrentPartner({ ...currentPartner, streamUrl: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="space-y-2 md:col-span-2"><Label>الوصف</Label><Textarea value={currentPartner?.description || ''} onChange={e => setCurrentPartner({ ...currentPartner, description: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="md:col-span-2 space-y-3">
              <Label className="text-sm font-bold">روابط التواصل</Label>
              {renderSocialFields(currentPartner?.socialLinks as Record<string, string> | undefined, (v) => setCurrentPartner({ ...currentPartner, socialLinks: v }))}
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={() => handleSave('partner', currentPartner)} className="bg-primary text-black font-black flex-1 rounded-xl">{tc('save')}</Button>
            <DialogClose asChild><Button variant="ghost" className="rounded-xl">{tc('cancel')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Member Dialog */}
      <Dialog open={dialogs.teamMember} onOpenChange={(v) => !v && closeDialog('teamMember')}>
        <DialogContent className="glass border-white/10 rounded-3xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gradient-gold">{t('dialogs.addEditTeamMember')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4" dir="rtl">
            <div className="space-y-2"><Label>الاسم</Label><Input value={currentTeamMember?.name || ''} onChange={e => setCurrentTeamMember({ ...currentTeamMember, name: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>المنصب</Label><Input value={currentTeamMember?.role || ''} onChange={e => setCurrentTeamMember({ ...currentTeamMember, role: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>رابط الصورة</Label><Input value={currentTeamMember?.imageUrl || ''} onChange={e => setCurrentTeamMember({ ...currentTeamMember, imageUrl: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="md:col-span-2 space-y-3">
              <Label className="text-sm font-bold">روابط التواصل</Label>
              {renderSocialFields(currentTeamMember?.socialLinks as Record<string, string> | undefined, (v) => setCurrentTeamMember({ ...currentTeamMember, socialLinks: v }))}
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={() => handleSave('teamMember', currentTeamMember)} className="bg-primary text-black font-black flex-1 rounded-xl">{tc('save')}</Button>
            <DialogClose asChild><Button variant="ghost" className="rounded-xl">{tc('cancel')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Streamer Dialog */}
      <Dialog open={dialogs.streamer} onOpenChange={(v) => !v && closeDialog('streamer')}>
        <DialogContent className="glass border-white/10 rounded-3xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gradient-gold">{t('dialogs.addEditStreamer')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4" dir="rtl">
            <div className="space-y-2"><Label>الاسم</Label><Input value={currentStreamer?.name || ''} onChange={e => setCurrentStreamer({ ...currentStreamer, name: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>الدور</Label><Input value={currentStreamer?.role || ''} onChange={e => setCurrentStreamer({ ...currentStreamer, role: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>رابط الصورة</Label><Input value={currentStreamer?.imageUrl || ''} onChange={e => setCurrentStreamer({ ...currentStreamer, imageUrl: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="space-y-2"><Label>رابط القناة</Label><Input value={currentStreamer?.channelLink || ''} onChange={e => setCurrentStreamer({ ...currentStreamer, channelLink: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="md:col-span-2 space-y-3">
              <Label className="text-sm font-bold">روابط التواصل</Label>
              {renderSocialFields(currentStreamer?.socialLinks as Record<string, string> | undefined, (v) => setCurrentStreamer({ ...currentStreamer, socialLinks: v }))}
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={() => handleSave('streamer', currentStreamer)} className="bg-primary text-black font-black flex-1 rounded-xl">{tc('save')}</Button>
            <DialogClose asChild><Button variant="ghost" className="rounded-xl">{tc('cancel')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={dialogs.rule} onOpenChange={(v) => !v && closeDialog('rule')}>
        <DialogContent className="glass border-white/10 rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gradient-gold">{t('dialogs.addEditRule')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="space-y-2"><Label>العنوان</Label><Input value={currentRule?.title || ''} onChange={e => setCurrentRule({ ...currentRule, title: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>الوصف</Label><Textarea value={currentRule?.description || ''} onChange={e => setCurrentRule({ ...currentRule, description: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={() => handleSave('rule', currentRule)} className="bg-primary text-black font-black flex-1 rounded-xl">{tc('save')}</Button>
            <DialogClose asChild><Button variant="ghost" className="rounded-xl">{tc('cancel')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio Track Dialog */}
      <Dialog open={dialogs.audioTrack} onOpenChange={(v) => !v && closeDialog('audioTrack')}>
        <DialogContent className="glass border-white/10 rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gradient-gold">{t('dialogs.addEditAudioTrack')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="space-y-2"><Label>العنوان</Label><Input value={currentAudioTrack?.title || ''} onChange={e => setCurrentAudioTrack({ ...currentAudioTrack, title: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>الرابط</Label><Input value={currentAudioTrack?.url || ''} onChange={e => setCurrentAudioTrack({ ...currentAudioTrack, url: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="space-y-2"><Label>الفنان</Label><Input value={currentAudioTrack?.artist || ''} onChange={e => setCurrentAudioTrack({ ...currentAudioTrack, artist: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>النوع</Label><Input value={currentAudioTrack?.type || ''} onChange={e => setCurrentAudioTrack({ ...currentAudioTrack, type: e.target.value as "music" | "quran" })} className="rounded-xl border-white/10 bg-white/5" /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={() => handleSave('audioTrack', currentAudioTrack)} className="bg-primary text-black font-black flex-1 rounded-xl">{tc('save')}</Button>
            <DialogClose asChild><Button variant="ghost" className="rounded-xl">{tc('cancel')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Dialog */}
      <Dialog open={dialogs.file} onOpenChange={(v) => !v && closeDialog('file')}>
        <DialogContent className="glass border-white/10 rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gradient-gold">{t('dialogs.addEditFile')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="space-y-2"><Label>اسم الملف</Label><Input value={currentFile?.fileName || ''} onChange={e => setCurrentFile({ ...currentFile, fileName: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
            <div className="space-y-2"><Label>رابط الملف</Label><Input value={currentFile?.fileUrl || ''} onChange={e => setCurrentFile({ ...currentFile, fileUrl: e.target.value })} className="rounded-xl border-white/10 bg-white/5 ltr" /></div>
            <div className="space-y-2"><Label>نوع الأيقونة</Label><Input value={currentFile?.iconClass || ''} onChange={e => setCurrentFile({ ...currentFile, iconClass: e.target.value })} className="rounded-xl border-white/10 bg-white/5" /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={() => handleSave('file', currentFile)} className="bg-primary text-black font-black flex-1 rounded-xl">{tc('save')}</Button>
            <DialogClose asChild><Button variant="ghost" className="rounded-xl">{tc('cancel')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass border-white/10 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">{t('dialogs.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-right">{t('dialogs.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl">{t('dialogs.confirmDelete')}</AlertDialogAction>
            <AlertDialogCancel className="rounded-xl mt-0">{tc('cancel')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
