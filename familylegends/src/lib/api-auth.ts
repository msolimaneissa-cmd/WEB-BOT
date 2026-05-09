import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from './auth';
import { timingSafeEqual } from 'crypto';

/**
 * دالة للمقارنة الآمنة زمنياً للسلاسل النصية (Timing Safe Comparison).
 */
function safeCompare(a: string, b: string): boolean {
  // Always compare with fixed-length hash to avoid length leak
  const crypto = require('crypto');
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/**
 * Verifies if the request is authenticated via NextAuth session or API secret.
 * @param req - The incoming Next.js request.
 * @returns {Promise<boolean>} - True if authenticated, false otherwise.
 */
export async function checkApiAuth(req: NextRequest): Promise<boolean> {
  const adminIds = (process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map(id => id.trim())
    .filter(id => id.length > 0);

  // Fail-closed: if ADMIN_IDS is empty, only bot-secret auth is allowed
  const requireAdminIds = adminIds.length > 0;

  // 1. Check for NextAuth session (best for dashboard requests)
  const session = await getServerSession(authOptions);
  if (session?.user?.isAdmin) {
    return true;
  }

  // 2. Check for JWT token directly (fallback for some client-side calls)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token?.isAdmin) {
    return true;
  }

  // 3. Fallback to constant admin IDs if session check fails (for legacy or specific cases)
  const userId = session?.user?.id || token?.sub;
  if (userId && adminIds.includes(userId)) {
    return true;
  }

  // 3. Check for API Secret (for bot-to-website communication)
  const authHeader = req.headers.get('authorization');
  const botSecretHeader = req.headers.get('x-bot-secret');
  const apiSecret = process.env.API_SECRET || process.env.BOT_CONTROL_SECRET;
  
  if (apiSecret) {
    // Check Authorization header
    if (authHeader) {
      const providedSecret = authHeader.replace('Bearer ', '');
      if (safeCompare(providedSecret, apiSecret)) {
        return true;
      }
    }
    // Check x-bot-secret header
    if (botSecretHeader && safeCompare(botSecretHeader, apiSecret)) {
      return true;
    }
  }

  return false;
}
