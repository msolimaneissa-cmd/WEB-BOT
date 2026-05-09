import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { getTeam } from '@/lib/fetch-data';
import { checkApiAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const defaultIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`api-${req.nextUrl?.pathname || 'unknown'}:${defaultIp}`, { maxRequests: 60, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

  try {
    // Auth check — team data should only be accessible to admins
    if (!await checkApiAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeam();
    return NextResponse.json(team);
  } catch (error) {
    console.error('Error in /api/bot/team:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
