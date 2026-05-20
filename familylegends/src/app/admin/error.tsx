'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-6 max-w-sm w-full glass-card rounded-2xl p-8 border border-destructive/20"
      >
        <motion.div
          className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">خطأ في لوحة التحكم</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            حدث خطأ أثناء تحميل هذه الصفحة. يمكنك إعادة المحاولة أو العودة للداشبورد.
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </Button>
          <Button size="sm" variant="outline" asChild className="gap-2">
            <Link href="/admin">
              <LayoutDashboard className="w-3.5 h-3.5" />
              الداشبورد
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
