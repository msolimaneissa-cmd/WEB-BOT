import { NextRequest, NextResponse } from 'next/server';
import { adminDb, serializeFirestoreData } from '@/lib/firebase-admin';
import { timingSafeEqual } from 'crypto';
import { getActivityTimeMs, type DiscordActivityItem } from './utils';
import crypto from 'crypto';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { withTiming } from '@/lib/api-timing';

// Validate webhook secret with constant-time comparison
function validateAuth(request: Request): boolean {
  const webhookSecret = process.env.DISCORD_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook] CRITICAL: DISCORD_WEBHOOK_SECRET is not defined!');
    return false;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.replace('Bearer ', '');

  // Constant-time comparison to prevent timing attacks
  try {
    const tokenBuf = Buffer.from(token, 'utf-8');
    const secretBuf = Buffer.from(webhookSecret, 'utf-8');
    if (tokenBuf.length !== secretBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, secretBuf);
  } catch {
    return false;
  }
}

// POST: Receive webhook events from Discord bot
async function handlePOST(request: Request) {
  try {
    const requestId = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    if (!validateAuth(request)) {
      console.warn(`[Webhook] Unauthorized access attempt for requestId: ${requestId}`);
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'webhook';
    const { allowed, resetInMs } = await checkRateLimit(`webhook:${ip}`, { maxRequests: 60, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      console.error(`[Webhook] Invalid JSON for requestId: ${requestId}`, err);
      return NextResponse.json({ error: 'Invalid JSON body', requestId }, { status: 400 });
    }
    const { event } = body;

    if (!event) {
      console.warn(`[Webhook] Missing event type for requestId: ${requestId}`);
      return NextResponse.json({ error: 'Event type is required', requestId }, { status: 400 });
    }

    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured', requestId }, { status: 500 });
    }
    console.log(`[Webhook] Processing event: ${event} (ID: ${requestId})`);

    switch (event) {
      case 'stream_start': {
        const { userId, username, streamUrl, platform, startedAt } = body;

        if (!username) {
          return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const streamersRef = db.collection('streamers');
        let q = streamersRef.where('name', '==', username);
        let snapshot = await q.get();

        if (snapshot.empty && userId) {
          q = streamersRef.where('discordId', '==', userId);
          snapshot = await q.get();
        }

        if (!snapshot.empty) {
          const streamerDoc = snapshot.docs[0];
          const updateData: Record<string, any> = {
            isLive: true,
            streamUrl: streamUrl || streamerDoc.data().channelLink,
            streamPlatform: platform || 'twitch',
            streamStartedAt: startedAt || Date.now(),
            lastUpdated: Date.now(),
          };
          if (userId) updateData.discordId = userId;
          await streamerDoc.ref.update(updateData);
          console.log(`[Webhook] Updated stream_start for ${username}`);
        } else {
          console.warn(`[Webhook] Streamer not found: ${username}`);
        }

        return NextResponse.json({ success: true, event: 'stream_start', username });
      }

      case 'stream_end': {
        const { userId, username: endUsername } = body;

        if (!endUsername && !userId) {
          return NextResponse.json({ error: 'Username or userId is required' }, { status: 400 });
        }

        const streamersRef = db.collection('streamers');
        let q = endUsername
          ? streamersRef.where('name', '==', endUsername)
          : streamersRef.where('discordId', '==', userId);
        let snapshot = await q.get();

        if (snapshot.empty && endUsername && userId) {
          q = streamersRef.where('discordId', '==', userId);
          snapshot = await q.get();
        }

        if (!snapshot.empty) {
          const streamerDoc = snapshot.docs[0];
          await streamerDoc.ref.update({
            isLive: false,
            streamUrl: null,
            streamPlatform: null,
            lastUpdated: Date.now(),
          });
          console.log(`[Webhook] Updated stream_end for ${endUsername || userId}`);
        }

        return NextResponse.json({ success: true, event: 'stream_end', username: endUsername || userId });
      }

      case 'member_join': {
        const { userId: joinUserId, username: joinUsername, memberCount } = body;

        await db.collection('settings').doc('discord-stats').set(
          {
            lastMemberJoin: {
              userId: joinUserId || null,
              username: joinUsername || 'Unknown',
              joinedAt: new Date().toISOString(),
            },
            totalMembers: memberCount || null,
            lastUpdated: Date.now(),
          },
          { merge: true }
        );

        return NextResponse.json({ success: true, event: 'member_join' });
      }

      case 'server_stats': {
        const {
          onlineMembers, totalMembers, boostCount, channelCount, roleCount,
          onlineCount, memberCount, botCount, guildId, guildName,
        } = body;

        const finalTotal = totalMembers ?? memberCount ?? 0;
        const finalOnline = onlineMembers ?? onlineCount ?? 0;

        await db.collection('settings').doc('discord-stats').set({
          onlineMembers: finalOnline,
          totalMembers: finalTotal,
          botCount: botCount ?? null,
          guildId: guildId ?? null,
          guildName: guildName ?? null,
          boostCount: boostCount ?? 0,
          channelCount: channelCount ?? 0,
          roleCount: roleCount ?? 0,
          lastUpdated: Date.now(),
        });

        console.log(`[Webhook] server_stats updated: ${finalTotal} members`);
        return NextResponse.json({ success: true, event: 'server_stats' });
      }

      case 'activity': {
        const { activityType, title, description, userId: actUserId, username: actUsername } = body;

        const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await db.collection('discord-activities').doc(actId).set({
          type: activityType || 'general',
          title: title || 'نشاط جديد',
          description: description || '',
          username: actUsername || 'Unknown',
          userId: actUserId || '',
          timestamp: new Date(),
        });

        return NextResponse.json({ success: true, event: 'activity', activityId: actId });
      }

      case 'ping':
        return NextResponse.json({ success: true, event: 'ping', message: 'Webhook is active' });

      default:
        console.warn(`[Webhook] Unknown event type: ${event} for requestId: ${requestId}`);
        return NextResponse.json({ error: `Unknown event type: ${event}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Fetch recent activities from Firestore
async function handleGET() {
  try {
    const db = adminDb();
    if (!db) {
      return NextResponse.json([]);
    }
    const snapshot = await db.collection('discord-activities').get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const activities: DiscordActivityItem[] = snapshot.docs.map((d) => serializeFirestoreData({
      id: d.id,
      ...d.data(),
    }));

    activities.sort(
      (a: DiscordActivityItem, b: DiscordActivityItem) =>
        getActivityTimeMs(b) - getActivityTimeMs(a)
    );

    return NextResponse.json(activities.slice(0, 20));
  } catch (error) {
    console.error('Discord activities fetch error:', error);
    return NextResponse.json([]);
  }
}

export const POST = withTiming(handlePOST as any, 'webhook-discord/POST');
export const GET = withTiming(handleGET as any, 'webhook-discord/GET');
