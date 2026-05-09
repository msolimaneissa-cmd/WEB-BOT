import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

// Paths that never need authentication
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/alliance-requests', // POST (new request submission from public)
  '/api/discord-stats',      // GET (stats for landing page)
  '/api/webhooks/discord',   // POST (webhook auth is handled internally)
  '/login',
];

// Timing-safe comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Bot-to-server paths protected by BOT_CONTROL_SECRET only (not NextAuth)
const BOT_SECRET_PATHS = [
  '/api/bot/status',
  '/api/bot/streamers',
  '/api/bot/config',
  '/api/bot/rules',
  '/api/bot/check-streamer',
  '/api/bot/sync',
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip entirely public paths
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublicPath) {
    // Some public paths allow POST (like webhooks or alliance requests)
    return NextResponse.next();
  }

  // 2. Bot-secret paths bypass NextAuth
  const isBotSecretPath = BOT_SECRET_PATHS.some(p => pathname.startsWith(p));
  if (isBotSecretPath) {
    const secret = request.headers.get('x-bot-secret') || '';
    const controlSecret = (process.env as any)['BOT_CONTROL_SECRET'] || '';
    if (safeCompare(secret, controlSecret)) return NextResponse.next();
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. All other /api/ routes + /admin/ routes require NextAuth session or API_SECRET
  const needsAuth =
    pathname.startsWith('/api/') || pathname.startsWith('/admin/');

  if (!needsAuth) return NextResponse.next();

  const authHeader = request.headers.get('authorization');
  let isAuthorized = false;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) isAuthorized = true;

  if (authHeader && safeCompare(authHeader.replace('Bearer ', ''), (process.env as any)['API_SECRET'] || '')) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'غير مصرح بهذا الطلب — تسجيل الدخول مطلوب' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. CSRF Protection for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // Origin header MUST be present for mutating requests
    if (!origin) {
      return NextResponse.json(
        { error: 'فشل التحقق من CSRF: Origin header مطلوب' },
        { status: 403 }
      );
    }

    try {
      const originUrl = new URL(origin);
      // Exact match required — not includes() — to prevent evil-subdomain.example.com bypass
      if (originUrl.host !== host) {
        return NextResponse.json(
          { error: 'فشل التحقق من CSRF: أصل غير متطابق' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'فشل التحقق من CSRF: Origin غير صالح' },
        { status: 403 }
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/bot/:path*',
    '/api/alliance-requests/:path*',
    '/api/discord-stats/:path*',
    '/api/webhooks/:path*',
    '/admin/:path*',
  ],
};

