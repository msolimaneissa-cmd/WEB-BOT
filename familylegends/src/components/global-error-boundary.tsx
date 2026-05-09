'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallback) return this.fallback;
      
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-white p-6">
          <div className="max-w-md w-full glass-card p-10 text-center border-red-500/20">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="font-headline text-3xl font-black mb-4 tracking-tighter">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              لقد واجه النظام مشكلة تقنية. يرجى محاولة إعادة تحميل الصفحة أو العودة لاحقاً.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold gap-3 text-lg"
              >
                <RotateCcw className="w-5 h-5" />
                إعادة تحميل الصفحة
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full text-muted-foreground hover:text-white"
              >
                محاولة الاستمرار
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-10 p-4 bg-black/40 rounded-xl text-left overflow-auto max-h-[200px] border border-white/5">
                <code className="text-xs text-red-400 font-mono">
                  {this.state.error?.message}
                  <br />
                  {this.state.error?.stack}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.children;
  }

  private get children() {
    return this.props.children;
  }

  private get fallback() {
    return this.props.fallback;
  }
}
