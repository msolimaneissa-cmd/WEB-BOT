import { NextRequest, NextResponse } from 'next/server';
import { adminDb, serializeFirestoreData } from '@/lib/firebase-admin';
import { checkApiAuth } from '@/lib/api-auth';
import * as admin from 'firebase-admin';
import { timingSafeEqual } from 'crypto';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

// GET: Return all streamers from Firestore with their live status
export async function GET(req: NextRequest) {
  try {
    // Auth check
    if (!await checkApiAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 500 });
    const streamersRef = db.collection('streamers');
    const snapshot = await streamersRef.orderBy('timestamp', 'desc').get();

    const streamers = snapshot.docs.map((doc) => serializeFirestoreData({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ streamers });
  } catch (error) {
    console.error('Get streamers error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب قائمة الستريمرز' },
      { status: 500 }
    );
  }
}

// POST: Add a new streamer
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-bot-secret');
    const configuredSecret = (process.env as any)['BOT_CONTROL_SECRET'];
    if (!configuredSecret) {
      return NextResponse.json({ success: false, error: 'Not configured' }, { status: 503 });
    }
    // Timing-safe comparison to prevent timing attacks
    try {
      const secretBuf = Buffer.from(String(secret || ''));
      const configBuf = Buffer.from(String(configuredSecret));
      if (secretBuf.length !== configBuf.length || !timingSafeEqual(secretBuf, configBuf)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`streamers:${ip}`, { maxRequests: 20, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    const body = await request.json();
    const { name, role, imageUrl, channelLink, socialLinks } = body;

    if (!name || !channelLink) {
      return NextResponse.json(
        { error: 'يجب تحديد الاسم ورابط القناة' },
        { status: 400 }
      );
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 500 });
    const streamersRef = db.collection('streamers');

    const docRef = await streamersRef.add({
      name,
      role: role || 'Member',
      imageUrl: imageUrl || '',
      channelLink,
      socialLinks: socialLinks || {},
      isLive: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, success: true });
  } catch (error) {
    console.error('Add streamer error:', error);
    return NextResponse.json(
      { error: 'فشل في إضافة الستريمر' },
      { status: 500 }
    );
  }
}
