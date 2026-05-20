'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Ghost, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4" dir="rtl">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 text-center space-y-8 max-w-lg"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
          className="relative inline-block"
        >
          <span className="text-[10rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-primary/80 to-primary/20 select-none">
            404
          </span>
          <motion.div
            className="absolute inset-0 -m-4"
            animate={{
              boxShadow: [
                '0 0 0px rgba(212,175,55,0)',
                '0 0 80px rgba(212,175,55,0.15)',
                '0 0 0px rgba(212,175,55,0)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* Icon */}
        <motion.div
          className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Ghost className="w-10 h-10 text-primary/70" />
        </motion.div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-foreground">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            يبدو أنك وصلت إلى صفحة لا وجود لها. ربما تم نقلها أو حذفها.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2 rounded-xl font-bold">
            <Link href="/">
              <Home className="w-5 h-5" />
              الصفحة الرئيسية
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 rounded-xl font-bold">
            <Link href="/admin">
              <ArrowRight className="w-5 h-5" />
              لوحة التحكم
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
