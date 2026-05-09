'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Gavel, Users, Handshake, Clapperboard, Music, Library, Settings } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';

export const fileIcons: { name: keyof typeof LucideIcons, icon: React.ReactNode }[] = [
  { name: 'File', icon: <LucideIcons.File /> },
  { name: 'ScrollText', icon: <LucideIcons.ScrollText /> },
  { name: 'FileArchive', icon: <LucideIcons.FileArchive /> },
  { name: 'FileAudio', icon: <LucideIcons.FileAudio /> },
  { name: 'FileCode', icon: <LucideIcons.FileCode /> },
  { name: 'FileImage', icon: <LucideIcons.FileImage /> },
  { name: 'FileText', icon: <LucideIcons.FileText /> },
  { name: 'FileVideo', icon: <LucideIcons.FileVideo /> },
];

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};

export const CardsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="glass-card rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, onAdd, addLabel }: {
  icon: React.ElementType;
  title: string;
  description: string;
  onAdd?: () => void;
  addLabel?: string;
}) => {
  const t = useTranslations('Common');
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-primary/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      {onAdd && (
        <Button onClick={onAdd} className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          {addLabel || t('addNew')}
        </Button>
      )}
    </motion.div>
  );
};

export const ItemCard = ({
  children,
  onEdit,
  onDelete,
  delay = 0
}: {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ delay, duration: 0.3 }}
    whileHover={{ y: -4 }}
    className="glass-card rounded-xl p-4 group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      {children}
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

export const getTabConfig = (t: (key: string) => string) => [
  { type: 'settings', title: t('tabs.settings'), icon: Settings, color: 'primary' },
  { type: 'partner', title: t('tabs.partners'), icon: Handshake, color: 'amber-400' },
  { type: 'rule', title: t('tabs.rules'), icon: Gavel, color: 'red-400' },
  { type: 'teamMember', title: t('tabs.team'), icon: Users, color: 'blue-400' },
  { type: 'streamer', title: t('tabs.streamers'), icon: Clapperboard, color: 'purple-400' },
  { type: 'audioTrack', title: t('tabs.audioTracks'), icon: Music, color: 'green-400' },
  { type: 'file', title: t('tabs.files'), icon: Library, color: 'cyan-400' },
] as const;
