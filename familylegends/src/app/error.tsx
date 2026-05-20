'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center space-y-6 max-w-md w-full"
      >
        {/* Animated Icon */}
        <motion.div
          className="mx-auto w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center relative"
          animate={{ boxShadow: ['0 0 20px rgba(239,68,68,0.1)', '0 0 40px rgba(239,68,68,0.25)', '0 0 20px rgba(239,68,68,0.1)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2 }}
          >
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground">حدث خطأ غير متوقع</h1>
          <p className="text-muted-foreground leading-relaxed">
            نعتذر، واجه النظام خطأً ما. تم تسجيل المشكلة تلقائياً وسيتم معالجتها.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono bg-foreground/5 rounded px-3 py-1 inline-block">
              رمز الخطأ: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              الصفحة الرئيسية
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
