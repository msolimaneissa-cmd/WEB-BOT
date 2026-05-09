import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>;

export function withTiming(handler: RouteHandler, routeName: string): RouteHandler {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      console.log(`[API Timing] ${routeName} ${response.status} ${duration}ms`);
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[API Timing] ${routeName} ERROR ${duration}ms:`, error);
      return NextResponse.json(
        { error: process.env.NODE_ENV === 'production' ? 'حدث خطأ داخلي في الخادم' : String(error) },
        { status: 500 }
      );
    }
  };
}
