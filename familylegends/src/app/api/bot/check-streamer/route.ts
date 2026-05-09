import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { timingSafeEqual } from 'crypto';

// ════════════════════════════════════════════════════
//  KICK — Free Public API
// ════════════════════════════════════════════════════
async function checkKickLive(username: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.kick.com/public/v1/channels/${username}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FamilyLegends-Bot/1.0',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.data?.is_live === true || data?.is_live === true;
  } catch {
    return false;
  }
}

// ════════════════════════════════════════════════════
//  TWITCH — Public channel check
// ════════════════════════════════════════════════════
async function checkTwitchLive(username: string): Promise<boolean> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID || 'kimne78kx3ncx6brgo4mv6wki5h1ko';
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${username}`, {
      headers: {
        'Client-Id': clientId,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ════════════════════════════════════════════════════
//  YOUTUBE — Check via handle page redirect
// ════════════════════════════════════════════════════
async function checkYoutubeLive(handleOrId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/${handleOrId}/live`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'FamilyLegends-Bot/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    const finalUrl = res.url || '';
    return finalUrl.includes('/watch?v=');
  } catch {
    return false;
  }
}

// ════════════════════════════════════════════════════
//  TIKTOK — Check live status via public page
// ════════════════════════════════════════════════════
async function checkTikTokLive(username: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.tiktok.com/@${username}/live`, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return false;

    const html = await res.text();

    return (
      html.includes('"isLive":true') ||
      (html.includes('LIVE') && html.includes('viewerCount')) ||
      html.includes('room_id')
    );
  } catch {
    return false;
  }
}

// ════════════════════════════════════════════════════
//  Detect platform from URL
// ════════════════════════════════════════════════════
function detectPlatformFromUrl(url: string): 'kick' | 'twitch' | 'youtube' | 'tiktok' | null {
  const u = url.toLowerCase();
  if (u.includes('kick.com')) return 'kick';
  if (u.includes('twitch.tv')) return 'twitch';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  return null;
}

function extractUsername(url: string): string {
  const clean = url.replace(/\/+$/, '').split('?')[0];
  const parts = clean.split('/');
  return parts[parts.length - 1] || '';
}

export async function GET(request: NextRequest) {
    const defaultIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`api-${request.nextUrl?.pathname || 'unknown'}:${defaultIp}`, { maxRequests: 60, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

  try {
    // Auth check — timing-safe comparison
    const secret = request.headers.get('x-bot-secret') || '';
    const configuredSecret = (process.env as any)['BOT_CONTROL_SECRET'] || '';
    if (!configuredSecret) {
      return NextResponse.json({ success: false, error: 'Not configured' }, { status: 503 });
    }
    try {
      const secretBuf = Buffer.from(String(secret));
      const configBuf = Buffer.from(String(configuredSecret));
      if (secretBuf.length !== configBuf.length || !timingSafeEqual(secretBuf, configBuf)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const platform = searchParams.get('platform');
    const username = searchParams.get('username');

    if (!name) {
      return NextResponse.json(
        { error: 'يجب تحديد اسم الستريمر (name)' },
        { status: 400 }
      );
    }

    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }
    let isLive = false;
    let detectedPlatform = platform as string || '';

    // If no platform/username provided, look up the streamer in Firestore
    if (!platform || !username) {
      const streamersRef = db.collection('streamers');
      const snapshot = await streamersRef.where('name', '==', name).limit(1).get();

      if (snapshot.empty) {
        return NextResponse.json(
          { error: 'الستريمر غير موجود' },
          { status: 404 }
        );
      }

      const streamerDoc = snapshot.docs[0];
      const channelLink = streamerDoc.data().channelLink || '';
      const p = detectPlatformFromUrl(channelLink);
      if (p) {
        detectedPlatform = p;
        const u = extractUsername(channelLink);
        switch (p) {
          case 'kick':
            isLive = await checkKickLive(u);
            break;
          case 'twitch':
            isLive = await checkTwitchLive(u);
            break;
          case 'youtube':
            isLive = await checkYoutubeLive(u);
            break;
          case 'tiktok':
            isLive = await checkTikTokLive(u);
            break;
        }

        // Update Firestore with the new status
        await streamerDoc.ref.update({
          isLive,
          lastLiveCheck: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Direct platform + username check
      detectedPlatform = platform.toLowerCase();
      switch (detectedPlatform) {
        case 'kick':
          isLive = await checkKickLive(username);
          break;
        case 'twitch':
          isLive = await checkTwitchLive(username);
          break;
        case 'youtube':
          isLive = await checkYoutubeLive(username);
          break;
        case 'tiktok':
          isLive = await checkTikTokLive(username);
          break;
        default:
          return NextResponse.json(
            { error: 'المنصة غير مدعومة. المنصات المتاحة: kick, twitch, youtube, tiktok' },
            { status: 400 }
          );
      }

      // Try to find and update the streamer in Firestore
      const streamersRef = db.collection('streamers');
      const snapshot = await streamersRef.where('name', '==', name).limit(1).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          isLive,
          lastLiveCheck: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      isLive,
      platform: detectedPlatform,
      checkedAt: Date.now(),
    });
  } catch (error) {
    console.error('Check streamer error:', error);
    return NextResponse.json(
      { error: 'فشل في فحص حالة الستريمر', isLive: false, platform: '', checkedAt: Date.now() },
      { status: 500 }
    );
  }
}
