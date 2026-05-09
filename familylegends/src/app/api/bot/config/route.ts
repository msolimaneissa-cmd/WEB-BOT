import { NextRequest, NextResponse } from 'next/server';
import { adminDb, serializeFirestoreData } from '@/lib/firebase-admin';
import { checkApiAuth } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

// GET: Get bot config from Firestore `settings/bot-config`
export async function GET(req: NextRequest) {
  try {
    // Auth check
    if (!await checkApiAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }
    const configRef = db.collection('settings').doc('bot-config');
    const configSnap = await configRef.get();

    if (!configSnap.exists) {
      return NextResponse.json({
        webhookUrl: '',
        exists: false,
      });
    }

    return NextResponse.json(serializeFirestoreData({
      id: configSnap.id,
      ...(() => {
        const data = configSnap.data();
        if (data) {
          const { webhookSecret, ...safeData } = data as Record<string, any>;
          return safeData;
        }
        return {};
      })(),
      exists: true,
    }));
  } catch (error) {
    console.error('Get bot config error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب إعدادات البوت' },
      { status: 500 }
    );
  }
}

// POST: Save bot config to Firestore `settings/bot-config`
export async function POST(request: NextRequest) {
  try {
    // Auth check
    if (!await checkApiAuth(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, resetInMs } = await checkRateLimit(`bot-config:${ip}`, { maxRequests: 10, windowMs: 60000 });
    if (!allowed) return rateLimitResponse(resetInMs);

    const body = await request.json();
    const { webhookUrl, webhookSecret } = body;

    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }
    const configRef = db.collection('settings').doc('bot-config');

    await configRef.set({
      webhookUrl: webhookUrl || '',
      webhookSecret: webhookSecret || '',
      updatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save bot config error:', error);
    return NextResponse.json(
      { error: 'فشل في حفظ إعدادات البوت' },
      { status: 500 }
    );
  }
}
