import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function getDb() {
  return adminDb();
}

// In-memory cache — 2 minutes
let lastCheckTime = 0;
const CHECK_INTERVAL = 2 * 60 * 1000;
let cachedResult: { liveStreamers: string[]; checkedAt: number; details: { id: string; name: string; platform: string; isLive: boolean }[] } | null = null;

// ─── Helper: Extract username from URL ───
function extractUsername(url: string): string {
  const clean = url.replace(/\/+$/, '').split('?')[0];
  const parts = clean.split('/');
  return parts[parts.length - 1] || '';
}

// ─── Helper: Detect platform from URL ───
function detectPlatform(url: string): 'kick' | 'twitch' | 'youtube' | 'tiktok' | null {
  const u = url.toLowerCase();
  if (u.includes('kick.com')) return 'kick';
  if (u.includes('twitch.tv')) return 'twitch';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  return null;
}

// ════════════════════════════════════════════════════
//  KICK — Free Public API (no auth needed!)
//  https://api.kick.com/public/v1/channels/{username}
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
//  TWITCH — Simple check via public embed/page
//  No API key needed — uses Twitch's public data
// ════════════════════════════════════════════════════
async function checkTwitchLive(username: string): Promise<boolean> {
  try {
    // Method 1: Try Twitch's public channel API (requires Client-ID from env)
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      console.warn('TWITCH_CLIENT_ID not set — skipping Twitch live check');
      return false;
    }
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
//  YOUTUBE — Check via RSS feed or public page
//  No API key needed
// ════════════════════════════════════════════════════
async function checkYoutubeLive(channelIdOrHandle: string): Promise<boolean> {
  try {
    // YouTube provides a live events RSS feed
    // Format: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
    // But since we might have a @handle, try the handle URL
    let feedUrl = '';
    if (channelIdOrHandle.startsWith('@')) {
      // Try to find live badge via the channel page
      const res = await fetch(`https://www.youtube.com/${channelIdOrHandle}/live`, {
        redirect: 'follow',
        headers: { 'User-Agent': 'FamilyLegends-Bot/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      // If redirecting to a video, they're likely live
      const finalUrl = res.url || '';
      return finalUrl.includes('/watch?v=');
    } else {
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdOrHandle}`;
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return false;
      const text = await res.text();
      // If feed contains "live" related content recently, consider it live
      return text.toLowerCase().includes('live') && text.includes('published');
    }
    return false;
  } catch {
    return false;
  }
}

// ════════════════════════════════════════════════════
//  TIKTOK — Check live status via public API
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

    // Check for live indicators in the page
    // Only use the most specific marker to avoid false positives
    // - "isLive":true is the most reliable JSON indicator
    // - Avoid broad checks like "LIVE", "room_id", or "viewerCount" which
    //   appear on non-live TikTok pages and cause false positives
    return html.includes('"isLive":true');
  } catch {
    return false;
  }
}

// ════════════════════════════════════════════════════
//  MAIN: Check all streamers
// ════════════════════════════════════════════════════
export async function GET() {
  try {
    const now = Date.now();

    // Return cached result if within interval
    if (cachedResult && (now - lastCheckTime) < CHECK_INTERVAL) {
      return NextResponse.json(cachedResult);
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { liveStreamers: [], checkedAt: now, details: [], error: 'Firebase Admin not configured' },
        { status: 500 }
      );
    }
    const q = db.collection('streamers').orderBy('timestamp', 'desc');
    const snapshot = await q.get();

    const liveStreamers: string[] = [];
    const details: { id: string; name: string; platform: string; isLive: boolean }[] = [];

    // Group streamers by platform for batch checking
    const toCheck: { id: string; name: string; username: string; platform: string }[] = [];

    for (const streamerDoc of snapshot.docs) {
      const data = streamerDoc.data();
      const channelLink = data.channelLink || '';
      const platform = detectPlatform(channelLink);

      if (!platform) {
        // No recognized platform — keep existing isLive status
        if (data.isLive) liveStreamers.push(streamerDoc.id);
        details.push({ id: streamerDoc.id, name: data.name, platform: 'unknown', isLive: !!data.isLive });
        continue;
      }

      const username = extractUsername(channelLink);
      if (!username) continue;

      toCheck.push({
        id: streamerDoc.id,
        name: data.name,
        username,
        platform,
      });
    }

    // Check each platform — all in parallel for speed!
    const checkPromises = toCheck.map(async (streamer) => {
      let isLive = false;

      switch (streamer.platform) {
        case 'kick':
          isLive = await checkKickLive(streamer.username);
          break;
        case 'twitch':
          isLive = await checkTwitchLive(streamer.username);
          break;
        case 'youtube':
          isLive = await checkYoutubeLive(streamer.username);
          break;
        case 'tiktok':
          isLive = await checkTikTokLive(streamer.username);
          break;
      }

      return { ...streamer, isLive };
    });

    const results = await Promise.allSettled(checkPromises);

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const { id, name, platform, isLive } = result.value;

      if (isLive) liveStreamers.push(id);
      details.push({ id, name, platform, isLive });

      // Update Firestore with new live status
      try {
        await db.collection('streamers').doc(id).update({
          isLive,
          lastLiveCheck: new Date(),
        });
      } catch {
        // Ignore individual update errors
      }
    }

    // Update cache
    lastCheckTime = now;
    cachedResult = {
      liveStreamers,
      checkedAt: now,
      details,
    };

    return NextResponse.json(cachedResult);
  } catch (error) {
    console.error('Check live error:', error);
    return NextResponse.json(
      { liveStreamers: [], checkedAt: Date.now(), details: [], error: 'Failed to check live status' },
      { status: 500 }
    );
  }
}
