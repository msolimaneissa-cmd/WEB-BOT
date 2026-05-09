'use client';

import dynamic from 'next/dynamic';
import { AudioPlayer } from "@/components/audio-player";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import { GlobalErrorBoundary } from "@/components/global-error-boundary";
import { Suspense } from 'react';

// Dynamically import BackgroundCanvas to prevent hydration issues
// and improve initial load time since it relies on browser-only APIs
const BackgroundCanvas = dynamic(() => import("@/components/background-canvas").then(m => m.BackgroundCanvas), {
    ssr: false,
});

export function LayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={null}>
                <BackgroundCanvas />
            </Suspense>
            
            <GlobalErrorBoundary fallback={<div className="h-20 bg-black/50 backdrop-blur-md flex items-center justify-center text-xs text-muted-foreground">فشل تحميل مشغل الصوت</div>}>
                <AudioPlayer />
            </GlobalErrorBoundary>

            <div id="page-content" className="relative z-10 flex flex-col flex-grow">
                {children}
            </div>

            <GlobalErrorBoundary fallback={<div className="h-40 bg-black/50 backdrop-blur-md flex items-center justify-center text-xs text-muted-foreground">فشل تحميل ذيل الصفحة</div>}>
                <Footer />
            </GlobalErrorBoundary>
            
            <Toaster />
        </>
    );
}
