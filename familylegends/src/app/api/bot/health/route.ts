import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @api {GET} /api/bot/health
 * @description جلب الحالة التقنية الحية للبوت (RAM, Uptime, Ping).
 */
export async function GET(req: NextRequest) {
    const defaultIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`api-${req.nextUrl?.pathname || 'unknown'}:${defaultIp}`, { maxRequests: 60, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

  try {
    const BOT_URL = process.env.BOT_INTERNAL_URL || 'http://localhost:8080';
    const BOT_SECRET = (process.env as any)['BOT_CONTROL_SECRET'];

    const response = await fetch(`${BOT_URL}/status`, {
      headers: { 'x-bot-secret': BOT_SECRET || '' },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error('Bot is offline or unreachable');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 503 });
  }
}
