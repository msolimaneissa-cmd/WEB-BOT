'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Shield,
  Users,
  Link as LinkIcon,
  Image as PictureIcon,
  MessageSquare,
  Hash,
  User,
  Globe,
  Video,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Crown,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface FormData {
  serverName: string;
  serverLogoUrl: string;
  inviteUrl: string;
  description: string;
  memberCount: string;
  ownerName: string;
  ownerDiscordId: string;
  ownerContact: string;
  streamUrl: string;
}

interface FormErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  serverName: '',
  serverLogoUrl: '',
  inviteUrl: '',
  description: '',
  memberCount: '',
  ownerName: '',
  ownerDiscordId: '',
  ownerContact: '',
  streamUrl: '',
};

export function AllianceRequestModal() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.serverName.trim()) {
      newErrors.serverName = 'اسم السيرفر مطلوب';
    }
    if (!formData.serverLogoUrl.trim()) {
      newErrors.serverLogoUrl = 'رابط الشعار مطلوب';
    } else if (
      !formData.serverLogoUrl.startsWith('http://') &&
      !formData.serverLogoUrl.startsWith('https://')
    ) {
      newErrors.serverLogoUrl = 'يجب أن يكون رابط صالح (https://)';
    }
    if (!formData.inviteUrl.trim()) {
      newErrors.inviteUrl = 'رابط الدعوة مطلوب';
    } else if (!formData.inviteUrl.startsWith('https://discord.gg/')) {
      newErrors.inviteUrl = 'يجب أن يبدأ الرابط بـ https://discord.gg/';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'وصف السيرفر مطلوب';
    }
    if (!formData.memberCount.trim()) {
      newErrors.memberCount = 'عدد الأعضاء مطلوب';
    } else if (parseInt(formData.memberCount) <= 0) {
      newErrors.memberCount = 'يجب أن يكون عدد الأعضاء أكبر من صفر';
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'اسم المالك مطلوب';
    }
    if (!formData.ownerDiscordId.trim()) {
      newErrors.ownerDiscordId = 'معرف الديسكورد مطلوب';
    }
    if (!formData.ownerContact.trim()) {
      newErrors.ownerContact = 'طريقة التواصل مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('idle');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/alliance-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverName: formData.serverName.trim(),
          serverLogoUrl: formData.serverLogoUrl.trim(),
          inviteUrl: formData.inviteUrl.trim(),
          description: formData.description.trim(),
          memberCount: parseInt(formData.memberCount),
          ownerName: formData.ownerName.trim(),
          ownerDiscordId: formData.ownerDiscordId.trim(),
          ownerContact: formData.ownerContact.trim(),
          streamUrl: formData.streamUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إرسال الطلب');
      }

      setSubmitStatus('success');
      toast({
        title: '✅ تم إرسال الطلب بنجاح!',
        description: 'سيتم مراجعة طلب التحالف والرد عليك قريباً',
      });

      setTimeout(() => {
        setFormData(initialFormData);
        setErrors({});
        setOpen(false);
        setTimeout(() => setSubmitStatus('idle'), 300);
      }, 2500);
    } catch (err) {
      setSubmitStatus('error');
      toast({
        title: '❌ فشل إرسال الطلب',
        description: err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
      });
      setTimeout(() => setSubmitStatus('idle'), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const inputClass = (field: string) =>
    cn(
      'bg-black/30 border-border/30 focus:border-primary/60 text-foreground placeholder:text-muted-foreground/50 backdrop-blur-sm transition-all duration-300',
      errors[field] && 'border-red-500/60 focus:border-red-500 bg-red-500/5'
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="default"
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-amber-500 text-black hover:from-amber-500 hover:to-primary font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
          >
            <Shield className="w-4 h-4" />
            <span>طلب تحالف</span>
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-card/95 to-background/95 backdrop-blur-2xl border border-primary/20 p-0 gap-0" dir="rtl">
        {/* Gold gradient top border */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="p-6 md:p-8">
          <DialogHeader className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <Crown className="w-8 h-8 text-black" />
            </motion.div>
            <DialogTitle className="text-2xl md:text-3xl font-heading font-bold text-gradient-gold text-center">
              طلب تحالف
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center mt-2 max-w-sm mx-auto">
              أرسل طلب تحالف لسيرفرك وكن جزءاً من عائلة الأساطير
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {submitStatus === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  className="inline-flex p-5 rounded-full bg-green-500/10 mb-6"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-green-400 mb-3">تم إرسال الطلب بنجاح!</h3>
                <p className="text-muted-foreground">سيتم مراجعة طلبك والرد عليك قريباً</p>
              </motion.div>
            ) : submitStatus === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ x: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex p-5 rounded-full bg-red-500/10 mb-6"
                >
                  <XCircle className="w-16 h-16 text-red-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-red-400 mb-3">فشل إرسال الطلب</h3>
                <p className="text-muted-foreground">يرجى المحاولة مرة أخرى لاحقاً</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Row 1: Server Name & Logo URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="serverName" className="text-foreground/80 flex items-center gap-2 text-sm">
                      <Hash className="w-4 h-4 text-primary" />
                      اسم السيرفر <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="serverName"
                      placeholder="مثال: Family Legends"
                      className={inputClass('serverName')}
                      value={formData.serverName}
                      onChange={(e) => handleChange('serverName', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.serverName && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {errors.serverName}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="serverLogoUrl" className="text-foreground/80 flex items-center gap-2 text-sm">
                      <PictureIcon className="w-4 h-4 text-primary" />
                      رابط الشعار <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="serverLogoUrl"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      className={cn(inputClass('serverLogoUrl'), 'dir-ltr')}
                      value={formData.serverLogoUrl}
                      onChange={(e) => handleChange('serverLogoUrl', e.target.value)}
                      disabled={isSubmitting}
                      dir="ltr"
                    />
                    {errors.serverLogoUrl && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {errors.serverLogoUrl}
                      </motion.p>
                    )}
                  </motion.div>
                </div>

                {/* Row 2: Invite URL & Member Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="inviteUrl" className="text-foreground/80 flex items-center gap-2 text-sm">
                      <LinkIcon className="w-4 h-4 text-primary" />
                      رابط الدعوة <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="inviteUrl"
                      type="url"
                      placeholder="https://discord.gg/..."
                      className={cn(inputClass('inviteUrl'), 'dir-ltr')}
                      value={formData.inviteUrl}
                      onChange={(e) => handleChange('inviteUrl', e.target.value)}
                      disabled={isSubmitting}
                      dir="ltr"
                    />
                    {errors.inviteUrl && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {errors.inviteUrl}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="memberCount" className="text-foreground/80 flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      عدد الأعضاء <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="memberCount"
                      type="number"
                      min="1"
                      placeholder="مثال: 500"
                      className={cn(inputClass('memberCount'), '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dir-ltr')}
                      value={formData.memberCount}
                      onChange={(e) => handleChange('memberCount', e.target.value)}
                      disabled={isSubmitting}
                      dir="ltr"
                    />
                    {errors.memberCount && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {errors.memberCount}
                      </motion.p>
                    )}
                  </motion.div>
                </div>

                {/* Description */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="description" className="text-foreground/80 flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    وصف السيرفر <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="اكتب وصفاً مختصراً عن سيرفرك وما يقدمه..."
                    className={cn(inputClass('description'), 'min-h-[100px] resize-none')}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      {errors.description}
                    </motion.p>
                  )}
                </motion.div>

                {/* Row 3: Owner Name & Discord ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="ownerName" className="text-foreground/80 flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-primary" />
                      اسم المالك <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ownerName"
                      placeholder="اسمك في الديسكورد"
                      className={inputClass('ownerName')}
                      value={formData.ownerName}
                      onChange={(e) => handleChange('ownerName', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.ownerName && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {errors.ownerName}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="ownerDiscordId" className="text-foreground/80 flex items-center gap-2 text-sm">
                      <Hash className="w-4 h-4 text-primary" />
                      معرف الديسكورد <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ownerDiscordId"
                      placeholder="مثال: 1234567890"
                      className={cn(inputClass('ownerDiscordId'), 'dir-ltr')}
                      value={formData.ownerDiscordId}
                      onChange={(e) => handleChange('ownerDiscordId', e.target.value)}
                      disabled={isSubmitting}
                      dir="ltr"
                    />
                    {errors.ownerDiscordId && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {errors.ownerDiscordId}
                      </motion.p>
                    )}
                  </motion.div>
                </div>

                {/* Row 4: Contact & Stream URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="ownerContact" className="text-foreground/80 flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-primary" />
                      طريقة التواصل <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ownerContact"
                      placeholder="رابط التواصل أو البريد الإلكتروني"
                      className={inputClass('ownerContact')}
                      value={formData.ownerContact}
                      onChange={(e) => handleChange('ownerContact', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.ownerContact && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {errors.ownerContact}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="streamUrl" className="text-foreground/80 flex items-center gap-2 text-sm">
                      <Video className="w-4 h-4 text-primary" />
                      رابط البث <span className="text-muted-foreground/50 text-xs">(اختياري)</span>
                    </Label>
                    <Input
                      id="streamUrl"
                      type="url"
                      placeholder="https://twitch.tv/..."
                      className="bg-black/30 border-border/30 focus:border-primary/60 text-foreground placeholder:text-muted-foreground/50 backdrop-blur-sm transition-all duration-300 dir-ltr"
                      value={formData.streamUrl}
                      onChange={(e) => handleChange('streamUrl', e.target.value)}
                      disabled={isSubmitting}
                      dir="ltr"
                    />
                  </motion.div>
                </div>

                {/* Submit Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="pt-4"
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full h-14 font-bold rounded-xl gap-2 transition-all duration-300 text-base',
                      isSubmitting
                        ? 'bg-primary/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-primary to-amber-500 text-black hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:scale-[1.02]'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جارٍ الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>إرسال طلب التحالف</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Gold gradient bottom border */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
      </DialogContent>
    </Dialog>
  );
}
